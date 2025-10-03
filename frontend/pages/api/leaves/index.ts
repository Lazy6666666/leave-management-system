import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUserProfile } from '@/lib/permissions';
import type { Leave, LeaveStatus } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({
        error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' }
      });
    }

    if (req.method === 'GET') {
      return handleGet(req, res, supabase, user.id);
    } else if (req.method === 'POST') {
      return handlePost(req, res, supabase, user.id);
    } else {
      return res.status(405).json({
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }
  } catch (error) {
    console.error('Leaves API error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, supabase: any, userId: string) {
  const { status, limit = '50', offset = '0', requester_id, approver_id } = req.query;
  const limitNum = Number(limit);
  const offsetNum = Number(offset);

  const profile = await getUserProfile(supabase, userId);

  let query = supabase
    .from('leaves')
    .select(`
      *,
      requester:profiles!leaves_requester_id_fkey(id, full_name, department, photo_url),
      leave_type:leave_types(id, name, description),
      approver:profiles!leaves_approver_id_fkey(id, full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offsetNum, offsetNum + limitNum - 1);

  // Filter by status
  if (status && typeof status === 'string') {
    query = query.eq('status', status);
  }

  // Filter by requester
  if (requester_id && typeof requester_id === 'string') {
    query = query.eq('requester_id', requester_id);
  }

  // Filter by approver
  if (approver_id && typeof approver_id === 'string') {
    query = query.eq('approver_id', approver_id);
  }

  // If not admin/hr, only show user's own leaves or leaves they need to approve
  if (profile?.role !== 'admin' && profile?.role !== 'hr') {
    query = query.or(`requester_id.eq.${userId},approver_id.eq.${userId}`);
  }

  const { data, error, count } = await query;

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(200).json({
    leaves: data ?? [],
    total: count ?? 0,
    hasMore: count ? count > offsetNum + limitNum : false,
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, supabase: any, userId: string) {
  const { start_date, end_date, leave_type_id, reason, days_count } = req.body;

  // Validation
  if (!start_date || !end_date || !leave_type_id || days_count === undefined) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Start date, end date, leave type, and days count are required'
      }
    });
  }

  if (days_count <= 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Days count must be greater than 0' }
    });
  }

  // Get user's manager
  const { data: profile } = await supabase
    .from('profiles')
    .select('manager_id')
    .eq('id', userId)
    .single();

  // Create leave request
  const { data, error } = await supabase
    .from('leaves')
    .insert({
      requester_id: userId,
      start_date,
      end_date,
      leave_type_id,
      days_count,
      reason: reason || null,
      status: 'pending',
      approver_id: profile?.manager_id || null,
    })
    .select(`
      *,
      requester:profiles!leaves_requester_id_fkey(id, full_name, department, photo_url),
      leave_type:leave_types(id, name, description),
      approver:profiles!leaves_approver_id_fkey(id, full_name)
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(201).json({
    leave: data,
    message: 'Leave request created successfully',
  });
}
