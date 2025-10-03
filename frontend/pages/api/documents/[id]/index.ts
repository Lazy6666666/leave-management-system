import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({
        error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' }
      });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Document ID is required' }
      });
    }

    if (req.method === 'GET') {
      return handleGet(req, res, supabase, user.id, id);
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      return handleUpdate(req, res, supabase, user.id, id);
    } else if (req.method === 'DELETE') {
      return handleDelete(req, res, supabase, user.id, id);
    } else {
      return res.status(405).json({
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }
  } catch (error) {
    console.error('Document API error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, supabase: any, userId: string, documentId: string) {
  const profile = await getUserProfile(supabase, userId);

  const { data: document, error } = await supabase
    .from('company_documents')
    .select(`
      *,
      uploader:profiles!company_documents_uploaded_by_fkey(id, full_name)
    `)
    .eq('id', documentId)
    .single();

  if (error || !document) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Document not found' }
    });
  }

  // Check access permissions
  if (!document.is_public && profile?.role !== 'admin' && profile?.role !== 'hr') {
    return res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have access to this document'
      }
    });
  }

  return res.status(200).json({ document });
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse, supabase: any, userId: string, documentId: string) {
  const profile = await getUserProfile(supabase, userId);

  if (!profile || !isAdminOrHr(profile.role)) {
    return res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only admin and HR can update documents'
      }
    });
  }

  const { name, document_type, expiry_date, is_public, metadata } = req.body;

  // Build update object
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (document_type !== undefined) updates.document_type = document_type;
  if (expiry_date !== undefined) updates.expiry_date = expiry_date;
  if (is_public !== undefined) updates.is_public = is_public;
  if (metadata !== undefined) updates.metadata = metadata;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'No fields to update' }
    });
  }

  const { data, error } = await supabase
    .from('company_documents')
    .update(updates)
    .eq('id', documentId)
    .select(`
      *,
      uploader:profiles!company_documents_uploaded_by_fkey(id, full_name)
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(200).json({
    document: data,
    message: 'Document updated successfully',
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, supabase: any, userId: string, documentId: string) {
  const profile = await getUserProfile(supabase, userId);

  if (!profile || !isAdminOrHr(profile.role)) {
    return res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only admin and HR can delete documents'
      }
    });
  }

  // Get document to delete file from storage
  const { data: document, error: fetchError } = await supabase
    .from('company_documents')
    .select('storage_path')
    .eq('id', documentId)
    .single();

  if (fetchError) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Document not found' }
    });
  }

  // Delete from storage
  if (document?.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('company-documents')
      .remove([document.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('company_documents')
    .delete()
    .eq('id', documentId);

  if (deleteError) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: deleteError.message }
    });
  }

  return res.status(200).json({
    message: 'Document deleted successfully',
  });
}
