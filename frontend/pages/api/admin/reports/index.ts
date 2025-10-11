import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';
import type { Database } from '@/lib/database.types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    const supabase = createServerClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('DEBUG - Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });

    if (!user) {
      console.log('DEBUG - No user found, returning 401');
      return res.status(401).json({ error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const profile = await getUserProfile(supabase, user.id);

    console.log('DEBUG - Profile check:', {
      profileFound: !!profile,
      profileRole: profile?.role
    });

    if (!profile || !isAdminOrHr(profile.role)) {
      console.log('DEBUG - Insufficient permissions, returning 403');
      return res.status(403).json({ error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Access denied', debug: { profileFound: !!profile, role: profile?.role } } });
    }

    const adminClient = createAdminClient();
    const currentYear = new Date().getFullYear();
    const { role } = req.query;

    // Type-safe role handling
    type UserRole = Database['public']['Enums']['user_role'];
    const roleFilter = (role && role !== 'all' ? role : null) as UserRole | null;

    let employeeQuery = adminClient.from('employees').select('id', { head: true, count: 'exact' });
    let managerQuery = adminClient.from('employees').select('id', { head: true, count: 'exact' });
    let hrQuery = adminClient.from('employees').select('id', { head: true, count: 'exact' });

    if (roleFilter) {
      employeeQuery = employeeQuery.eq('role', roleFilter);
      managerQuery = managerQuery.eq('role', roleFilter);
      hrQuery = hrQuery.eq('role', roleFilter);
    }

    const [totalEmployees, totalManagers, totalHr, pendingLeaves] = await Promise.all([
      employeeQuery.eq('role', 'employee' as UserRole),
      managerQuery.eq('role', 'manager' as UserRole),
      hrQuery.eq('role', 'hr' as UserRole),
      adminClient.from('leaves').select('id', { head: true, count: 'exact' }).eq('status', 'pending'),
    ]);

    const { data: leaveStatistics, error: statsError } = await adminClient.rpc(
      role ? 'get_filtered_leave_statistics' : 'get_leave_statistics',
      {
        p_user_id: user.id,
        p_year: currentYear,
        p_role: role && role !== 'all' ? role : null,
      }
    );

    if (statsError) {
      console.error('DEBUG - Leave statistics error:', {
        error: statsError.message,
        code: statsError.code,
        details: statsError.details,
        hint: statsError.hint,
        role,
        userId: user.id,
      });
      return res.status(400).json({ error: { code: 'STATISTICS_ERROR', message: statsError.message, debug: { role, hint: statsError.hint } } });
    }

    // Ensure leaveStatistics has proper structure even if empty
    const normalizedStats = leaveStatistics || {
      by_leave_type: [],
      total_employees: 0,
      total_leaves_pending: 0,
      total_leaves_approved: 0,
      total_days_taken: 0
    };

    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    // Gracefully handle optional table queries - don't fail if tables are missing/empty
    let expiringDocuments = 0;
    let notificationsLast7Days = 0;

    try {
      const { count, error: docsError } = await adminClient
        .from('company_documents')
        .select('id', { head: true, count: 'exact' })
        .is('deleted_at', null)
        .not('expiry_date', 'is', null)
        .gte('expiry_date', nowIso)
        .lte('expiry_date', inThirtyDays);

      if (!docsError && count !== null) {
        expiringDocuments = count;
      } else if (docsError) {
        console.warn('DEBUG - company_documents query failed:', docsError.message);
      }
    } catch (error) {
      console.warn('DEBUG - company_documents table may not exist:', error instanceof Error ? error.message : 'Unknown error');
    }

    try {
      const { count, error: notifError } = await adminClient
        .from('notification_logs')
        .select('id', { head: true, count: 'exact' })
        .gte('sent_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!notifError && count !== null) {
        notificationsLast7Days = count;
      } else if (notifError) {
        console.warn('DEBUG - notification_logs query failed:', notifError.message);
      }
    } catch (error) {
      console.warn('DEBUG - notification_logs table may not exist:', error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('DEBUG - API Response Summary:', {
      totalEmployees: totalEmployees.count ?? 0,
      totalManagers: totalManagers.count ?? 0,
      totalHr: totalHr.count ?? 0,
      pendingLeaves: pendingLeaves.count ?? 0,
      documentsExpiringSoon: expiringDocuments,
      notificationsLast7Days: notificationsLast7Days,
      hasLeaveStatistics: !!normalizedStats,
    });

    return res.status(200).json({
      summary: {
        totalEmployees: totalEmployees.count ?? 0,
        totalManagers: totalManagers.count ?? 0,
        totalHr: totalHr.count ?? 0,
        pendingLeaves: pendingLeaves.count ?? 0,
        documentsExpiringSoon: expiringDocuments,
        notificationsLast7Days: notificationsLast7Days,
        leaveStatistics: normalizedStats,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error',
      },
    });
  }
}
