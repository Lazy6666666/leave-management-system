import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUserProfile } from '@/lib/permissions';
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

    const { id: documentId } = req.query;

    if (!documentId || typeof documentId !== 'string') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Document ID is required' }
      });
    }

    if (req.method === 'GET') {
      return handleGet(req, res, supabase, user.id, documentId);
    } else if (req.method === 'POST') {
      return handlePost(req, res, supabase, user.id, documentId);
    } else if (req.method === 'DELETE') {
      return handleDelete(req, res, supabase, user.id, documentId);
    } else {
      return res.status(405).json({
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }
  } catch (error) {
    console.error('Document notifiers API error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient, userId: string, documentId: string) {
  // Verify document exists
  const { data: document, error: docError } = await supabase
    .from('company_documents')
    .select('id')
    .eq('id', documentId)
    .single();

  if (docError || !document) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Document not found' }
    });
  }

  // Get notifiers for this document
  const { data: notifiers, error } = await supabase
    .from('document_notifiers')
    .select(`
      *,
      user:profiles!document_notifiers_user_id_fkey(id, full_name, email),
      document:company_documents(id, name)
    `)
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(200).json({
    notifiers: notifiers ?? [],
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient, userId: string, documentId: string) {
  // Verify document exists
  const { data: document, error: docError } = await supabase
    .from('company_documents')
    .select('id')
    .eq('id', documentId)
    .single();

  if (docError || !document) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Document not found' }
    });
  }

  const { user_id, notification_frequency, custom_frequency_days, status = 'active' } = req.body;

  // Validation
  if (!user_id || !notification_frequency) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'User ID and notification frequency are required'
      }
    });
  }

  if (!['weekly', 'monthly', 'custom'].includes(notification_frequency)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Notification frequency must be weekly, monthly, or custom'
      }
    });
  }

  if (notification_frequency === 'custom' && (!custom_frequency_days || custom_frequency_days <= 0)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Custom frequency days must be greater than 0'
      }
    });
  }

  // Check if notifier already exists
  const { data: existing } = await supabase
    .from('document_notifiers')
    .select('id')
    .eq('document_id', documentId)
    .eq('user_id', user_id)
    .single();

  if (existing) {
    return res.status(400).json({
      error: {
        code: 'ALREADY_EXISTS',
        message: 'Notifier already exists for this user and document'
      }
    });
  }

  // Create notifier
  const { data, error } = await supabase
    .from('document_notifiers')
    .insert({
      user_id,
      document_id: documentId,
      notification_frequency,
      custom_frequency_days: notification_frequency === 'custom' ? custom_frequency_days : null,
      status,
    })
    .select(`
      *,
      user:profiles!document_notifiers_user_id_fkey(id, full_name, email),
      document:company_documents(id, name)
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(201).json({
    notifier: data,
    message: 'Notifier created successfully',
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient, userId: string, documentId: string) {
  const { notifier_id } = req.query;

  if (!notifier_id || typeof notifier_id !== 'string') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Notifier ID is required' }
    });
  }

  // Delete notifier
  const { error } = await supabase
    .from('document_notifiers')
    .delete()
    .eq('id', notifier_id)
    .eq('document_id', documentId);

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(200).json({
    message: 'Notifier deleted successfully',
  });
}
