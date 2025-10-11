import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
// deno-lint-ignore-file no-explicit-any
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Type Definitions
// ============================================================================

interface ExportFilters {
  query?: string;
  department?: string;
  role?: string;
}

interface EmployeeData {
  id: string;
  supabase_id: string;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  department: string | null;
  created_at: string;
  leave_balances: LeaveBalance[];
  leave_requests: LeaveRequest[];
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

interface EmployeeProfile {
  role: string;
  first_name: string | null;
  last_name: string | null;
  name: string;
}

interface ExportRow {
  [key: string]: string | number;
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
    // Get environment variables
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

    // Create Supabase client
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
      .select('role, first_name, last_name, name')
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

    const employeeProfile = employee as EmployeeProfile;

    // Only HR and Admin can export employees
    const userRole = employeeProfile.role.toLowerCase();
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
    const filters: ExportFilters = await req.json();
    const { query, department, role } = filters;

    // Get all employees matching filters (no pagination for export)
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
      .order('last_name', { ascending: true });

    // Apply filters
    if (query) {
      searchQuery = searchQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,name.ilike.%${query}%`);
    }

    if (department) {
      searchQuery = searchQuery.eq('department', department);
    }

    if (role) {
      searchQuery = searchQuery.eq('role', role.toLowerCase());
    }

    const { data: employeesData, error: searchError } = await searchQuery;

    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    if (!employeesData || employeesData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No employees found to export' } as ErrorResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process data for Excel export
    const currentYear = new Date().getFullYear();
    const exportData: ExportRow[] = [];

    // Get user full name
    const exporterName = employeeProfile.first_name && employeeProfile.last_name
      ? `${employeeProfile.first_name} ${employeeProfile.last_name}`
      : employeeProfile.name;

    // Add export metadata
    const exportInfo: ExportRow = {
      'Export Date': new Date().toLocaleDateString(),
      'Generated By': exporterName,
      'User Role': employeeProfile.role,
      'Total Employees': employeesData.length,
      'Year': currentYear
    };

    // Main employee data
    for (const emp of employeesData as EmployeeData[]) {
      const leaveBalances = emp.leave_balances || [];
      const currentBalances = leaveBalances.filter((balance) => balance.year === currentYear);

      const leaveRequests = emp.leave_requests || [];
      const approvedRequests = leaveRequests.filter((req) => req.status === 'approved');

      const employeeRow: ExportRow = {
        'First Name': emp.first_name || '',
        'Last Name': emp.last_name || '',
        'Full Name': emp.name,
        'Email': emp.email,
        'Role': emp.role,
        'Department': emp.department || 'Unknown',
        'Join Date': new Date(emp.created_at).toLocaleDateString(),
      };

      // Add leave balance columns for each leave type
      for (const balance of currentBalances) {
        const usedDays = approvedRequests
          .filter(req => req.leave_type_id === balance.leave_type_id)
          .reduce((total, req) => {
            const start = new Date(req.start_date);
            const end = new Date(req.end_date);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return total + days;
          }, 0);

        const remainingDays = Math.max(0, balance.total_days - usedDays);

        const leaveTypeName = balance.leave_types?.name || 'Unknown';
        employeeRow[`${leaveTypeName} Allocated`] = balance.total_days;
        employeeRow[`${leaveTypeName} Used`] = usedDays;
        employeeRow[`${leaveTypeName} Remaining`] = remainingDays;
      }

      exportData.push(employeeRow);
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();

    // Add summary sheet
    const summarySheet = XLSX.utils.json_to_sheet([exportInfo]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Export Summary');

    // Add employee data sheet
    const employeeSheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Employee Data');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create response with Excel file
    const fileName = `employee-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new Response(excelBuffer as Uint8Array, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Export employees error:', error);

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
