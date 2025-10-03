// @deno-types="https://deno.land/x/types/react/v16.14.22/react.d.ts"
// @deno-types="https://deno.land/x/types/react-dom/v16.9.0/server.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.2.3';

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface ApprovalRequest {
  leave_id: string;
  action: 'approved' | 'rejected';
  comments?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization') || '';

    // Create a Supabase client with the Auth context of the function caller
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

    // Verify user has approval permissions
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['manager', 'admin', 'hr'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { headers: { ...corsHeaders }, status: 403 }
      );
    }

    const requestData: ApprovalRequest = await req.json();

    // Get leave request details
    const { data: leave, error: leaveError } = await supabaseClient
      .from('leaves')
      .select('*, requester:profiles!requester_id(full_name, email)')
      .eq('id', requestData.leave_id)
      .single();

    if (leaveError || !leave) {
      return new Response(
        JSON.stringify({ error: 'Leave request not found' }),
        { headers: { ...corsHeaders }, status: 404 }
      );
    }

    // Update leave status
    const updateData: Record<string, unknown> = {
      status: requestData.action,
      approver_id: user.id,
      comments: requestData.comments,
      updated_at: new Date().toISOString(),
    };

    if (requestData.action === 'approved') {
      updateData.approved_at = new Date().toISOString();

      // Update leave balance
      const { error: balanceError } = await supabaseClient.rpc('update_leave_balance', {
        p_employee_id: leave.requester_id,
        p_leave_type_id: leave.leave_type_id,
        p_days_used: leave.days_count,
        p_year: new Date().getFullYear(),
      });

      if (balanceError) {
        console.error('Failed to update balance:', balanceError);
      }
    }

    const { data: updatedLeave, error: updateError } = await supabaseClient
      .from('leaves')
      .update(updateData)
      .eq('id', requestData.leave_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { headers: { ...corsHeaders }, status: 400 }
      );
    }

    // Send notification to employee (implement email logic here)
    // TODO: Integrate with email service

    return new Response(
      JSON.stringify({ success: true, data: updatedLeave }),
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
