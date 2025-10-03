// @deno-types="https://deno.land/x/types/react/v16.14.22/react.d.ts"
// @deno-types="https://deno.land/x/types/react-dom/v16.9.0/server.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.2.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface LeaveRequest {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

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

    // Get authenticated user
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

    const requestData: LeaveRequest = await req.json();

    // Calculate business days
    const startDate = new Date(requestData.start_date);
    const endDate = new Date(requestData.end_date);
    let businessDays = 0;

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        businessDays++;
      }
    }

    // Get leave type details
    const { data: leaveType, error: leaveTypeError } = await supabaseClient
      .from('leave_types')
      .select('default_allocation_days')
      .eq('id', requestData.leave_type_id)
      .single();

    if (leaveTypeError || !leaveType) {
      return new Response(
        JSON.stringify({ error: 'Invalid leave type' }),
        { headers: { ...corsHeaders }, status: 400 }
      );
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const { data: availableDays, error: availableDaysError } = await supabaseClient.rpc('get_available_leave_days', {
      p_employee_id: user.id,
      p_leave_type_id: requestData.leave_type_id,
      p_year: currentYear,
    });

    if (availableDaysError) {
      return new Response(
        JSON.stringify({ error: availableDaysError.message }),
        { headers: { ...corsHeaders }, status: 400 }
      );
    }

    if (availableDays < businessDays) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient leave balance',
          available: availableDays,
          requested: businessDays,
        }),
        { headers: { ...corsHeaders }, status: 400 }
      );
    }

    // Create leave request
    const { data: leave, error: leaveError } = await supabaseClient
      .from('leaves')
      .insert({
        requester_id: user.id,
        leave_type_id: requestData.leave_type_id,
        start_date: requestData.start_date,
        end_date: requestData.end_date,
        days_count: businessDays,
        reason: requestData.reason,
        metadata: requestData.metadata,
        status: 'pending',
      })
      .select()
      .single();

    if (leaveError) {
      return new Response(
        JSON.stringify({ error: leaveError.message }),
        { headers: { ...corsHeaders }, status: 400 }
      );
    }

    // Send notification to manager (implement email logic here)
    // TODO: Integrate with email service

    return new Response(
      JSON.stringify(leave),
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
