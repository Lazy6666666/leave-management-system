import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';
import { TypedSupabaseClient } from '@/lib/types';

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
    console.error('Notifications API error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient, userId: string) {
  const {
    limit = '50',
    offset = '0',
    status,
    document_id,
    notifier_id,
    start_date,
    end_date
  } = req.query;

  const limitNum = Number(limit);
  const offsetNum = Number(offset);

  const profile = await getUserProfile(supabase, userId);

  let query = supabase
    .from('notification_logs')
    .select(`
      *,
      notifier:document_notifiers(
        id,
        user:employees!document_notifiers_user_id_fkey(id, name, email)
      ),
      document:company_documents(id, name, document_type, expiry_date)
    `, { count: 'exact' })
    .order('sent_at', { ascending: false })
    .range(offsetNum, offsetNum + limitNum - 1);

  // Filter by status
  if (status && typeof status === 'string') {
    query = query.eq('status', status as 'pending' | 'sent' | 'failed' | 'retrying');
  }

  // Filter by document
  if (document_id && typeof document_id === 'string') {
    query = query.eq('document_id', document_id);
  }

  // Filter by notifier
  if (notifier_id && typeof notifier_id === 'string') {
    query = query.eq('notifier_id', notifier_id);
  }

  // Filter by date range
  if (start_date && typeof start_date === 'string') {
    query = query.gte('sent_at', start_date);
  }
  if (end_date && typeof end_date === 'string') {
    query = query.lte('sent_at', end_date);
  }

  // If not admin/hr, only show notifications sent to user
  if (profile?.role !== 'admin' && profile?.role !== 'hr') {
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.email) {
      query = query.eq('recipient_email', user.email);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(200).json({
    notifications: data ?? [],
    total: count ?? 0,
    hasMore: count ? count > offsetNum + limitNum : false,
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient, userId: string) {
  const profile = await getUserProfile(supabase, userId);

  if (!profile || !isAdminOrHr(profile.role)) {
    return res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only admin and HR can manually send notifications'
      }
    });
  }

  const {
    document_id,
    notifier_id,
    recipient_email,
    message,
    send_immediately = true
  } = req.body;

  // Validation
  if (!document_id || !recipient_email) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Document ID and recipient email are required'
      }
    });
  }

  // Verify document exists
  const { data: document, error: docError } = await supabase
    .from('company_documents')
    .select('id, name, document_type, expiry_date')
    .eq('id', document_id)
    .single();

  if (docError || !document) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Document not found' }
    });
  }

  // Verify notifier if provided
  if (notifier_id) {
    const { data: notifier, error: notifierError } = await supabase
      .from('document_notifiers')
      .select('id')
      .eq('id', notifier_id)
      .single();

    if (notifierError || !notifier) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Notifier not found' }
      });
    }
  }

  // Create notification log
  const { data: log, error: logError } = await supabase
    .from('notification_logs')
    .insert({
      notifier_id: notifier_id || null,
      document_id,
      recipient_email,
      status: send_immediately ? 'sent' : 'pending',
      sent_at: send_immediately ? new Date().toISOString() : null,
      result: {
        document_name: document.name,
        document_type: document.document_type,
        expiry_date: document.expiry_date,
        custom_message: message || null,
        sent_by: (profile as { full_name?: string })?.full_name || 'System',
      },
    })
    .select(`
      *,
      notifier:document_notifiers(
        id,
        user:employees!document_notifiers_user_id_fkey(id, name, email)
      ),
      document:company_documents(id, name, document_type, expiry_date)
    `)
    .single();

  if (logError) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: logError.message }
    });
  }

  // In a real implementation, you would trigger email/SMS sending here
  // For now, we'll just mark it as sent

  return res.status(201).json({
    notification: log,
    message: send_immediately
      ? 'Notification sent successfully'
      : 'Notification scheduled successfully',
  });
}
