// @deno-types="https://deno.land/x/types/react/v16.14.22/react.d.ts"
// @deno-types="https://deno.land/x/types/react-dom/v16.9.0/server.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.2.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders }, status: 401 }
      );
    }

    // Verify HR/Admin role
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'hr'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { headers: { ...corsHeaders }, status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetYear = body.year || new Date().getFullYear();

    // Get all employees
    const { data: employees, error: employeesError } = await supabaseClient
      .from('profiles')
      .select('id');

    if (employeesError) {
      return new Response(
        JSON.stringify({ error: employeesError.message }),
        { headers: { ...corsHeaders }, status: 400 }
      );
    }

    // Get all leave types
    const { data: leaveTypes, error: leaveTypesError } = await supabaseClient
      .from('leave_types')
      .select('id, default_allocation_days')
      .eq('is_active', true);

    if (leaveTypesError) {
      return new Response(
        JSON.stringify({ error: leaveTypesError.message }),
        { headers: { ...corsHeaders }, status: 400 }
      );
    }

    const balancesToCreate = [];

    for (const employee of employees || []) {
      for (const leaveType of leaveTypes || []) {
        // Check if balance already exists
        const { data: existing, error: existingError } = await supabaseClient
          .from('leave_balances')
          .select('id')
          .eq('employee_id', employee.id)
          .eq('leave_type_id', leaveType.id)
          .eq('year', targetYear)
          .maybeSingle();

        if (existingError && existingError.code !== 'PGRST116') { // Ignore no rows found error
          console.error('Error checking existing balance:', existingError);
        }

        if (!existing) {
          balancesToCreate.push({
            employee_id: employee.id,
            leave_type_id: leaveType.id,
            allocated_days: leaveType.default_allocation_days,
            used_days: 0,
            carried_forward_days: 0,
            year: targetYear,
          });
        }
      }
    }

    if (balancesToCreate.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('leave_balances')
        .insert(balancesToCreate);

      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { headers: { ...corsHeaders }, status: 400 }
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Leave balances initialized',
        year: targetYear,
        balances_created: balancesToCreate.length,
      }),
      { headers: { ...corsHeaders }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders }, status: 500 }
    );
  }
});
