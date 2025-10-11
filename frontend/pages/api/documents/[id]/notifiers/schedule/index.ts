import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({
        error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' }
      });
    }

    const profile = await getUserProfile(supabase, user.id);

    if (!profile || !isAdminOrHr(profile.role)) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only admin and HR can schedule notifications'
        }
      });
    }

    const { id: documentId } = req.query;

    if (!documentId || typeof documentId !== 'string') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Document ID is required' }
      });
    }

    // Verify document exists
    const { data: document, error: docError } = await supabase
      .from('company_documents')
      .select('id, name, expiry_date')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Document not found' }
      });
    }

    // Get active notifiers for this document
    const { data: notifiers, error: notifiersError } = await supabase
      .from('document_notifiers')
      .select(`
        *,
        user:employees!document_notifiers_user_id_fkey(id, name, email)
      `)
      .eq('document_id', documentId)
      .eq('status', 'active');

    if (notifiersError) {
      return res.status(400).json({
        error: { code: 'DATABASE_ERROR', message: notifiersError.message }
      });
    }

    if (!notifiers || notifiers.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_NOTIFIERS',
          message: 'No active notifiers found for this document'
        }
      });
    }

    // Check which notifiers need notifications based on their frequency
    const now = new Date();
    const notifiersToSend = notifiers.filter((notifier) => {
      if (!notifier.last_notification_sent) {
        return true; // Never sent, send now
      }

      const lastSent = new Date(notifier.last_notification_sent);
      const daysSinceLastSent = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));

      switch (notifier.notification_frequency) {
        case 'weekly':
          return daysSinceLastSent >= 7;
        case 'monthly':
          return daysSinceLastSent >= 30;
        case 'custom':
          return daysSinceLastSent >= (notifier.custom_frequency_days || 7);
        default:
          return false;
      }
    });

    if (notifiersToSend.length === 0) {
      return res.status(200).json({
        message: 'No notifications scheduled - all notifiers recently sent',
        scheduled: 0,
      });
    }

    // Create notification logs
    const notificationLogs = notifiersToSend.map((notifier) => ({
      notifier_id: notifier.id,
      document_id: documentId,
      recipient_email: notifier.user?.email || '',
      status: 'pending' as const,
      result: {
        document_name: document.name,
        expiry_date: document.expiry_date,
        frequency: notifier.notification_frequency,
      },
    }));

    const { data: logs, error: logsError } = await supabase
      .from('notification_logs')
      .insert(notificationLogs)
      .select();

    if (logsError) {
      return res.status(400).json({
        error: { code: 'DATABASE_ERROR', message: logsError.message }
      });
    }

    // Update last_notification_sent for notifiers
    const notifierUpdates = notifiersToSend.map((notifier) =>
      supabase
        .from('document_notifiers')
        .update({ last_notification_sent: now.toISOString() })
        .eq('id', notifier.id)
    );

    await Promise.all(notifierUpdates);

    // In a real implementation, you would trigger email/SMS sending here
    // For now, we'll just mark them as sent
    const updateLogsPromises = logs.map((log) =>
      supabase
        .from('notification_logs')
        .update({
          status: 'sent',
          sent_at: now.toISOString(),
        })
        .eq('id', log.id)
    );

    await Promise.all(updateLogsPromises);

    return res.status(200).json({
      message: `Scheduled ${notifiersToSend.length} notifications successfully`,
      scheduled: notifiersToSend.length,
      logs: logs ?? [],
    });
  } catch (error) {
    console.error('Schedule notifications error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
    });
  }
}
