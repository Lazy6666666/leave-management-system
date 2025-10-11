import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Type Definitions
// ============================================================================

interface SearchFilters {
  query?: string;
  department?: string;
  role?: string;
  page?: number;
  limit?: number;
}

interface EmployeeProfile {
  id: string;
  supabase_id: string;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  department: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface LeaveBalance {
  leave_type_id: string;
  total_days: number;
  used_days: number;
  year: number;
  leave_types: {
    id: string;
    name: string;
  } | null;
}

interface LeaveRequest {
  id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  leave_types: {
    id: string;
    name: string;
  } | null;
}

interface EmployeeWithRelations extends EmployeeProfile {
  leave_balances: LeaveBalance[];
  leave_requests: LeaveRequest[];
}

interface LeaveSummary {
  leave_type: string;
  allocated: number;
  used: number;
  remaining: number;
}

interface FormattedEmployee {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  role: string;
  department: string;
  leave_balance: LeaveSummary[];
  created_at: string;
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

interface SuccessResponse {
  employees: FormattedEmployee[];
  pagination: PaginationInfo;
}

interface ErrorResponse {
  error: string;
}

// ============================================================================
// Edge Function Handler
// ============================================================================

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' } as ErrorResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient: SupabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' } as ErrorResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is HR or Admin using employees table
    const { data: employee, error: employeeError } = await supabaseClient
      .from('employees')
      .select('role')
      .eq('supabase_id', user.id)
      .single();

    if (employeeError || !employee) {
      return new Response(
        JSON.stringify({ error: 'Employee profile not found' } as ErrorResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Only HR and Admin can search employees
    const userRole = employee.role.toLowerCase();
    if (!['hr', 'admin'].includes(userRole)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. HR or Admin access required.' } as ErrorResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const filters: SearchFilters = await req.json();
    const { query, department, role, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // Build search query using employees table
    let searchQuery = supabaseClient
      .from('employees')
      .select(`
        id,
        supabase_id,
        email,
        name,
        first_name,
        last_name,
        role,
        department,
        photo_url,
        is_active,
        created_at,
        leave_balances (
          leave_type_id,
          total_days,
          used_days,
          year,
          leave_types (
            id,
            name
          )
        ),
        leave_requests (
          id,
          leave_type_id,
          start_date,
          end_date,
          status,
          created_at,
          leave_types (
            id,
            name
          )
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (query) {
      // Case-insensitive search on name fields
      searchQuery = searchQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,name.ilike.%${query}%`);
    }

    if (department) {
      searchQuery = searchQuery.eq('department', department);
    }

    if (role) {
      searchQuery = searchQuery.eq('role', role.toLowerCase());
    }

    // Get total count for pagination
    let countQuery = supabaseClient
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (query) {
      countQuery = countQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,name.ilike.%${query}%`);
    }

    if (department) {
      countQuery = countQuery.eq('department', department);
    }

    if (role) {
      countQuery = countQuery.eq('role', role.toLowerCase());
    }

    const [resultsResponse, countResponse] = await Promise.all([
      searchQuery,
      countQuery
    ]);

    if (resultsResponse.error) {
      throw resultsResponse.error;
    }

    const totalCount = countResponse.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Format response data
    const employees: FormattedEmployee[] = (resultsResponse.data as EmployeeWithRelations[]).map(emp => {
      // Calculate leave balances summary
      const leaveBalances = emp.leave_balances || [];
      const currentYear = new Date().getFullYear();
      const currentBalances = leaveBalances.filter(balance => balance.year === currentYear);

      // Calculate total leave taken this year (approved requests)
      const leaveRequests = emp.leave_requests || [];
      const approvedRequests = leaveRequests.filter(req => req.status === 'approved');

      const leaveSummary: LeaveSummary[] = currentBalances.map(balance => {
        const usedDays = approvedRequests
          .filter(req => req.leave_type_id === balance.leave_type_id)
          .reduce((total, req) => {
            const start = new Date(req.start_date);
            const end = new Date(req.end_date);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return total + days;
          }, 0);

        const remainingDays = Math.max(0, balance.total_days - usedDays);

        return {
          leave_type: balance.leave_types?.name || 'Unknown',
          allocated: balance.total_days,
          used: usedDays,
          remaining: remainingDays
        };
      });

      return {
        id: emp.id,
        email: emp.email,
        first_name: emp.first_name,
        last_name: emp.last_name,
        full_name: emp.name,
        role: emp.role,
        department: emp.department || 'Unknown',
        leave_balance: leaveSummary,
        created_at: emp.created_at
      };
    });

    const response: SuccessResponse = {
      employees,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: totalCount,
        per_page: limit
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Search employees error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return new Response(
      JSON.stringify({
        error: errorMessage
      } as ErrorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
