// ============================================================================
// Edge Function: get-org-stats
// Description: Serve aggregated organizational statistics from materialized view
// Created: 2025-10-09
// Phase: PHASE 2 - Admin Dashboard Live Intelligence & Data Visualization
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.2.3';
import { corsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '../_shared/rate-limiter.ts';

// ============================================================================
// Type Definitions
// ============================================================================

interface DepartmentStat {
  department: string;
  employee_count: number;
  manager_count: number;
}

interface LeaveTypeStat {
  leave_type_id: string;
  leave_type_name: string;
  total_requests: number;
  approved_requests: number;
  pending_requests: number;
  rejected_requests: number;
  total_days_taken: number;
  avg_days_per_request: number;
}

interface MonthlyTrend {
  month_num: number;
  month_name: string;
  total_requests: number;
  approved_requests: number;
  total_days: number;
}

interface TopRequester {
  employee_id: string;
  full_name: string;
  department: string;
  role: string;
  total_requests: number;
  total_days_taken: number;
}

interface DepartmentLeaveStat {
  department: string;
  total_requests: number;
  approved_requests: number;
  pending_requests: number;
  total_days_taken: number;
  avg_days_per_employee: number;
}

interface OrgStatsResponse {
  last_refreshed: string;
  employee_stats: {
    total_employees: number;
    total_managers: number;
    total_hr: number;
    total_admins: number;
    total_active_users: number;
    total_inactive_users: number;
  };
  department_stats: DepartmentStat[] | null;
  current_year_leave_stats: {
    pending_leaves: number;
    approved_leaves: number;
    rejected_leaves: number;
    cancelled_leaves: number;
    total_leaves: number;
    total_approved_days: number;
    avg_leave_duration: number;
  };
  leave_type_stats: LeaveTypeStat[] | null;
  monthly_trends: MonthlyTrend[] | null;
  top_requesters: TopRequester[] | null;
  department_leave_stats: DepartmentLeaveStat[] | null;
  approval_metrics: {
    total_processed: number;
    total_approved: number;
    total_rejected: number;
    avg_approval_time_hours: number;
    approval_rate: number;
    overdue_pending_requests: number;
  };
}

interface EmployeeProfile {
  role: string;
  full_name?: string;
  name?: string;
}

interface ResponseMetadata {
  response_time_ms: number;
  user: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
  message?: string;
  retryAfter?: number;
  required_role?: string[];
  current_role?: string;
  response_time_ms?: number;
}

// ============================================================================
// Edge Function Handler
// ============================================================================

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use GET.' } as ErrorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  }

  const startTime = Date.now();

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' } as ErrorResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' } as ErrorResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Create a Supabase client with the Auth context of the function caller
    const supabaseClient: SupabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Invalid or missing authentication token.' } as ErrorResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    // Check rate limit (use existing rate limiter)
    const rateLimitResult = await checkRateLimit(
      req,
      user.id,
      RATE_LIMITS.adminOperations || { maxRequests: 100, windowMs: 60000 }
    );

    if (!rateLimitResult.allowed) {
      const errorResponse: ErrorResponse = {
        error: 'Rate limit exceeded. Too many requests.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimitResult)
          },
          status: 429
        }
      );
    }

    // Verify user has admin/hr permissions using employees table
    const { data: employee, error: employeeError } = await supabaseClient
      .from('employees')
      .select('role, name')
      .eq('supabase_id', user.id)
      .single();

    if (employeeError || !employee) {
      return new Response(
        JSON.stringify({ error: 'Employee profile not found' } as ErrorResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    const employeeProfile = employee as EmployeeProfile;

    // Only HR and Admin can access organizational statistics
    if (!['admin', 'hr'].includes(employeeProfile.role)) {
      const errorResponse: ErrorResponse = {
        error: 'Insufficient permissions. Admin or HR role required.',
        required_role: ['admin', 'hr'],
        current_role: employeeProfile.role
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    // Query the materialized view for organizational statistics
    const { data: orgStats, error: statsError } = await supabaseClient
      .from('org_statistics')
      .select('*')
      .single();

    if (statsError) {
      console.error('Error fetching org statistics:', statsError);

      const errorResponse: ErrorResponse = {
        error: 'Failed to fetch organizational statistics',
        details: statsError.message
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    if (!orgStats) {
      return new Response(
        JSON.stringify({
          error: 'No statistics data available. Materialized view may need to be refreshed.'
        } as ErrorResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Get user name (full_name or name)
    const userName = employeeProfile.full_name || employeeProfile.name || 'Unknown';

    // Return the statistics with metadata
    const response: OrgStatsResponse & { meta: ResponseMetadata } = {
      ...(orgStats as OrgStatsResponse),
      meta: {
        response_time_ms: responseTime,
        user: userName
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Response-Time': `${responseTime}ms`,
          ...getRateLimitHeaders(rateLimitResult)
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Unexpected error in get-org-stats:', error);

    // Calculate response time even in error case
    const responseTime = Date.now() - startTime;

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      message: errorMessage,
      response_time_ms: responseTime
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Response-Time': `${responseTime}ms`
        },
        status: 500
      }
    );
  }
});
