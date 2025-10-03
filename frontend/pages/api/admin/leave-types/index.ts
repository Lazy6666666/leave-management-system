import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';
import { upsertLeaveTypeSchema } from '@/lib/schemas/admin';

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
      const { includeInactive, search } = req.query;

      let query = supabase
        .from('leave_types')
        .select('*')
        .order('name', { ascending: true });

      if (includeInactive !== 'true') {
        query = query.eq('is_active', true);
      }

      if (search && typeof search === 'string') {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: { code: 'DATABASE_ERROR', message: error.message } });
      }

      return res.status(200).json({ leaveTypes: data ?? [] });
    }

    if (req.method === 'POST') {
      const adminClient = createAdminClient();
      const parsed = upsertLeaveTypeSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } });
      }

      const { id, ...rest } = parsed.data;
      const timestamp = new Date().toISOString();

      if (id) {
        const { error } = await adminClient
          .from('leave_types')
          .update({ ...rest, updated_at: timestamp })
          .eq('id', id);

        if (error) {
          return res.status(400).json({ error: { code: 'DATABASE_ERROR', message: error.message } });
        }

        await adminClient.from('audit_logs').insert({
          user_id: user.id,
          table_name: 'leave_types',
          record_id: id,
          action: 'UPDATE',
          new_values: rest,
        });

        return res.status(200).json({ success: true, id });
      }

      const { data, error } = await adminClient
        .from('leave_types')
        .insert({ ...rest, created_at: timestamp, updated_at: timestamp })
        .select('id')
        .single();

      if (error) {
        return res.status(400).json({ error: { code: 'DATABASE_ERROR', message: error.message } });
      }

      await adminClient.from('audit_logs').insert({
        user_id: user.id,
        table_name: 'leave_types',
        record_id: data.id,
        action: 'INSERT',
        new_values: rest,
      });

      return res.status(200).json({ success: true, id: data.id });
    }

    if (req.method === 'DELETE') {
      const adminClient = createAdminClient();
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'id query parameter is required' } });
      }

      const { error } = await adminClient
        .from('leave_types')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(400).json({ error: { code: 'DATABASE_ERROR', message: error.message } });
      }

      await adminClient.from('audit_logs').insert({
        user_id: user.id,
        table_name: 'leave_types',
        record_id: id,
        action: 'DELETE',
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
