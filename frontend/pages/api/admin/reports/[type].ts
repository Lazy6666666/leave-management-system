import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';
import type { LeaveWithRequester } from '@/lib/types';

interface ReportParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  leaveTypeId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    const supabase = createServerClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const profile = await getUserProfile(supabase, user.id);

    if (!profile || !isAdminOrHr(profile.role)) {
      return res.status(403).json({ error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Access denied' } });
    }

    const { type } = req.query;
    const { startDate, endDate, department, leaveTypeId } = req.query as ReportParams;

    const adminClient = createAdminClient();

    switch (type) {
      case 'leave-usage':
        return await getLeaveUsageReport(adminClient, res, { startDate, endDate, department, leaveTypeId });
      
      case 'leave-by-type':
        return await getLeaveByTypeReport(adminClient, res, { startDate, endDate, department });
      
      case 'leave-by-department':
        return await getLeaveByDepartmentReport(adminClient, res, { startDate, endDate, leaveTypeId });
      
      case 'leave-trends':
        return await getLeaveTrendsReport(adminClient, res, { startDate, endDate, department, leaveTypeId });
      
      case 'employee-balances':
        return await getEmployeeBalancesReport(adminClient, res, { department, leaveTypeId });
      
      default:
        return res.status(400).json({ error: { code: 'INVALID_REPORT_TYPE', message: 'Invalid report type' } });
    }
  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error',
      },
    });
  }
}

async function getLeaveUsageReport(
  adminClient: ReturnType<typeof createAdminClient>,
  res: NextApiResponse,
  params: ReportParams
) {
  const { startDate, endDate, department, leaveTypeId } = params;

  let query = adminClient
    .from('leaves')
    .select(`
      id,
      start_date,
      end_date,
      days_count,
      status,
      requester:requester_id(id, full_name, department),
      leave_type:leave_type_id(id, name)
    `)
    .in('status', ['approved', 'pending']);

  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  if (endDate) {
    query = query.lte('end_date', endDate);
  }

  const { data: leaves, error } = await query;

  if (error) {
    return res.status(400).json({ error: { code: 'QUERY_ERROR', message: error.message } });
  }

  // Filter by department and leave type in memory (since we need to access nested fields)
  let filteredLeaves = (leaves as unknown as LeaveWithRequester[]) || [];
  
  if (department) {
    filteredLeaves = filteredLeaves.filter(leave => 
      leave.requester?.department === department
    );
  }
  
  if (leaveTypeId) {
    filteredLeaves = filteredLeaves.filter(leave => 
      leave.leave_type?.id === leaveTypeId
    );
  }

  const totalDays = filteredLeaves.reduce((sum, leave) => sum + (leave.days_count || 0), 0);
  const approvedDays = filteredLeaves
    .filter(leave => leave.status === 'approved')
    .reduce((sum, leave) => sum + (leave.days_count || 0), 0);
  const pendingDays = filteredLeaves
    .filter(leave => leave.status === 'pending')
    .reduce((sum, leave) => sum + (leave.days_count || 0), 0);

  return res.status(200).json({
    summary: {
      totalRequests: filteredLeaves.length,
      totalDays,
      approvedDays,
      pendingDays,
    },
    data: filteredLeaves,
  });
}

async function getLeaveByTypeReport(
  adminClient: ReturnType<typeof createAdminClient>,
  res: NextApiResponse,
  params: ReportParams
) {
  const { startDate, endDate, department } = params;

  let query = adminClient
    .from('leaves')
    .select(`
      id,
      days_count,
      status,
      leave_type:leave_type_id(id, name),
      requester:requester_id(id, department)
    `)
    .eq('status', 'approved');

  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  if (endDate) {
    query = query.lte('end_date', endDate);
  }

  const { data: leaves, error } = await query;

  if (error) {
    return res.status(400).json({ error: { code: 'QUERY_ERROR', message: error.message } });
  }

  let filteredLeaves = leaves || [];

  if (department) {
    filteredLeaves = filteredLeaves.filter(leave => {
      const requester = leave.requester as { department?: string }
      return requester?.department === department
    });
  }

  // Aggregate by leave type
  const aggregated = filteredLeaves.reduce((acc, leave) => {
    const leaveType = leave.leave_type;
    const typeName = (leaveType as { name?: string })?.name || 'Unknown';
    const typeId = (leaveType as { id?: string })?.id || 'unknown';
    
    if (!acc[typeId]) {
      acc[typeId] = {
        leaveTypeId: typeId,
        leaveTypeName: typeName,
        totalRequests: 0,
        totalDays: 0,
      };
    }
    
    acc[typeId].totalRequests += 1;
    acc[typeId].totalDays += leave.days_count || 0;
    
    return acc;
  }, {} as Record<string, { leaveTypeId: string; leaveTypeName: string; totalRequests: number; totalDays: number }>);

  const data = Object.values(aggregated);

  return res.status(200).json({ data });
}

async function getLeaveByDepartmentReport(
  adminClient: ReturnType<typeof createAdminClient>,
  res: NextApiResponse,
  params: ReportParams
) {
  const { startDate, endDate, leaveTypeId } = params;

  let query = adminClient
    .from('leaves')
    .select(`
      id,
      days_count,
      status,
      leave_type:leave_type_id(id, name),
      requester:requester_id(id, full_name, department)
    `)
    .eq('status', 'approved');

  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  if (endDate) {
    query = query.lte('end_date', endDate);
  }

  const { data: leaves, error } = await query;

  if (error) {
    return res.status(400).json({ error: { code: 'QUERY_ERROR', message: error.message } });
  }

  let filteredLeaves = leaves || [];

  if (leaveTypeId) {
    filteredLeaves = filteredLeaves.filter(leave => {
      const leaveType = leave.leave_type as { id?: string }
      return leaveType?.id === leaveTypeId
    });
  }

  // Aggregate by department
  const aggregated = filteredLeaves.reduce((acc, leave) => {
    const department = (leave.requester as { department?: string })?.department || 'Unassigned';
    
    if (!acc[department]) {
      acc[department] = {
        department,
        totalRequests: 0,
        totalDays: 0,
      };
    }
    
    acc[department].totalRequests += 1;
    acc[department].totalDays += leave.days_count || 0;
    
    return acc;
  }, {} as Record<string, { department: string; totalRequests: number; totalDays: number }>);

  const data = Object.values(aggregated);

  return res.status(200).json({ data });
}

async function getLeaveTrendsReport(
  adminClient: ReturnType<typeof createAdminClient>,
  res: NextApiResponse,
  params: ReportParams
) {
  const { startDate, endDate, department, leaveTypeId } = params;

  let query = adminClient
    .from('leaves')
    .select(`
      id,
      start_date,
      days_count,
      status,
      leave_type:leave_type_id(id, name),
      requester:requester_id(id, department)
    `)
    .eq('status', 'approved')
    .order('start_date', { ascending: true });

  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  if (endDate) {
    query = query.lte('end_date', endDate);
  }

  const { data: leaves, error } = await query;

  if (error) {
    return res.status(400).json({ error: { code: 'QUERY_ERROR', message: error.message } });
  }

  let filteredLeaves = (leaves as unknown as LeaveWithRequester[]) || [];
  
  if (department) {
    filteredLeaves = filteredLeaves.filter(leave => 
      leave.requester?.department === department
    );
  }
  
  if (leaveTypeId) {
    filteredLeaves = filteredLeaves.filter(leave => 
      leave.leave_type?.id === leaveTypeId
    );
  }

  // Aggregate by month
  const aggregated = filteredLeaves.reduce((acc, leave) => {
    const date = new Date(leave.start_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        totalRequests: 0,
        totalDays: 0,
      };
    }
    
    acc[monthKey].totalRequests += 1;
    acc[monthKey].totalDays += leave.days_count || 0;
    
    return acc;
  }, {} as Record<string, { month: string; totalRequests: number; totalDays: number }>);

  const data = Object.values(aggregated).sort((a, b) => a.month.localeCompare(b.month));

  return res.status(200).json({ data });
}

async function getEmployeeBalancesReport(
  adminClient: ReturnType<typeof createAdminClient>,
  res: NextApiResponse,
  params: ReportParams
) {
  const { department, leaveTypeId } = params;

  // Get all profiles
  let profileQuery = adminClient
    .from('profiles')
    .select('id, full_name, department, role')
    .in('role', ['employee', 'manager']);

  if (department) {
    profileQuery = profileQuery.eq('department', department);
  }

  const { data: profiles, error: profileError } = await profileQuery;

  if (profileError) {
    return res.status(400).json({ error: { code: 'QUERY_ERROR', message: profileError.message } });
  }

  // Get leave allocations
  let allocationQuery = adminClient
    .from('leave_allocations')
    .select(`
      user_id,
      leave_type_id,
      allocated_days,
      used_days,
      carried_forward_days,
      leave_type:leave_type_id(id, name)
    `);

  if (leaveTypeId) {
    allocationQuery = allocationQuery.eq('leave_type_id', leaveTypeId);
  }

  const { data: allocations, error: allocationError } = await allocationQuery;

  if (allocationError) {
    return res.status(400).json({ error: { code: 'QUERY_ERROR', message: allocationError.message } });
  }

  // Combine data
  const data = (profiles || []).map(profile => {
    const userAllocations = (allocations || []).filter(a => a.user_id === profile.id);
    
    const totalAllocated = userAllocations.reduce((sum, a) => sum + (a.allocated_days || 0) + (a.carried_forward_days || 0), 0);
    const totalUsed = userAllocations.reduce((sum, a) => sum + (a.used_days || 0), 0);
    const totalAvailable = totalAllocated - totalUsed;

    return {
      userId: profile.id,
      employeeName: profile.full_name,
      department: profile.department || 'Unassigned',
      role: profile.role,
      totalAllocated,
      totalUsed,
      totalAvailable,
      allocations: userAllocations.map(a => ({
        leaveTypeId: a.leave_type_id,
        leaveTypeName: (a.leave_type as { name?: string })?.name || 'Unknown',
        allocated: (a.allocated_days || 0) + (a.carried_forward_days || 0),
        used: a.used_days || 0,
        available: (a.allocated_days || 0) + (a.carried_forward_days || 0) - (a.used_days || 0),
      })),
    };
  });

  return res.status(200).json({ data });
}
