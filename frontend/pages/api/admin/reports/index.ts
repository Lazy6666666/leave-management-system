import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';

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

    const [totalEmployees, totalManagers, totalHr, pendingLeaves] = await Promise.all([
      adminClient.from('profiles').select('id', { head: true, count: 'exact' }).eq('role', 'employee'),
      adminClient.from('profiles').select('id', { head: true, count: 'exact' }).eq('role', 'manager'),
      adminClient.from('profiles').select('id', { head: true, count: 'exact' }).eq('role', 'hr'),
      adminClient.from('leaves').select('id', { head: true, count: 'exact' }).eq('status', 'pending'),
    ]);

    const { data: leaveStatistics, error: statsError } = await adminClient.rpc('get_leave_statistics', {
      p_user_id: user.id,
      p_year: currentYear,
    });

    if (statsError) {
      return res.status(400).json({ error: { code: 'STATISTICS_ERROR', message: statsError.message } });
    }

    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    const [{ count: expiringDocuments }, { count: notificationsLast7Days }] = await Promise.all([
      adminClient
        .from('company_documents')
        .select('id', { head: true, count: 'exact' })
        .is('deleted_at', null)
        .not('expiry_date', 'is', null)
        .gte('expiry_date', nowIso)
        .lte('expiry_date', inThirtyDays),
      adminClient
        .from('notification_logs')
        .select('id', { head: true, count: 'exact' })
        .gte('sent_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return res.status(200).json({
      summary: {
        totalEmployees: totalEmployees.count ?? 0,
        totalManagers: totalManagers.count ?? 0,
        totalHr: totalHr.count ?? 0,
        pendingLeaves: pendingLeaves.count ?? 0,
        documentsExpiringSoon: expiringDocuments ?? 0,
        notificationsLast7Days: notificationsLast7Days ?? 0,
        leaveStatistics,
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
