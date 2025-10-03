import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    const supabase = createServerClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const profile = await getUserProfile(supabase, user.id);

    if (!profile || !isAdminOrHr(profile.role)) {
      return res.status(403).json({ error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Access denied' } });
    }

    const { limit = '50', offset = '0', table, userId } = req.query;
    const limitNum = Number(limit);
    const offsetNum = Number(offset);

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (table && typeof table === 'string') {
      query = query.eq('table_name', table);
    }

    if (userId && typeof userId === 'string') {
      query = query.eq('user_id', userId);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ error: { code: 'DATABASE_ERROR', message: error.message } });
    }

    return res.status(200).json({
      logs: data ?? [],
      total: count ?? 0,
      hasMore: count ? count > offsetNum + limitNum : false,
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
