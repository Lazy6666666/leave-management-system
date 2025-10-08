import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';
import { updateUserRoleSchema } from '@/lib/schemas/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    if (req.method === 'GET') {
      const { role, search, limit = '50', offset = '0' } = req.query;
      const limitNum = Number(limit);
      const offsetNum = Number(offset);

      let query = supabase
        .from('employees')
        .select('id, supabase_id, name, email, role, department, is_active', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);

      if (role && typeof role === 'string') {
        query = query.eq('role', role);
      }

      if (search && typeof search === 'string') {
        query = query.ilike('full_name', `%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        return res.status(400).json({ error: { code: 'DATABASE_ERROR', message: error.message } });
      }

      return res.status(200).json({
        users: data ?? [],
        total: count ?? 0,
        hasMore: count ? count > offsetNum + limitNum : false,
      });
    }

    if (req.method === 'PATCH') {
      const adminClient = createAdminClient();
      const parsed = updateUserRoleSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } });
      }

      const { user_id, new_role } = parsed.data;

      if (user_id === user.id) {
        return res.status(400).json({ error: { code: 'ROLE_SELF_UPDATE', message: 'You cannot change your own role' } });
      }

      const { error } = await adminClient
        .from('employees')
        .update({ role: new_role, updated_at: new Date().toISOString() })
        .eq('id', user_id);

      if (error) {
        return res.status(400).json({ error: { code: 'DATABASE_ERROR', message: error.message } });
      }

      await adminClient.from('audit_logs').insert({
        user_id: user.id,
        table_name: 'employees',
        record_id: user_id,
        action: 'UPDATE',
        new_values: { role: new_role },
      });

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const adminClient = createAdminClient();
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'id query parameter is required' } });
      }

      if (id === user.id) {
        return res.status(400).json({ error: { code: 'DEACTIVATE_SELF', message: 'You cannot deactivate yourself' } });
      }

      const { error } = await adminClient
        .from('employees')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return res.status(400).json({ error: { code: 'DATABASE_ERROR', message: error.message } });
      }

      await adminClient.from('audit_logs').insert({
        user_id: user.id,
        table_name: 'employees',
        record_id: id,
        action: 'UPDATE',
        new_values: { is_active: false },
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error',
      },
    });
  }
}
