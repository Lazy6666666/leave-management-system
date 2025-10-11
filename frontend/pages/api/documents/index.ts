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
    } else if (req.method === 'DELETE') {
      return handleDelete(req, res, supabase, user.id);
    } else {
      return res.status(405).json({
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }
  } catch (error) {
    console.error('Documents API error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient, userId: string) {
  const { limit = '50', offset = '0', document_type, is_public } = req.query;
  const limitNum = Number(limit);
  const offsetNum = Number(offset);

  const profile = await getUserProfile(supabase, userId);

  let query = supabase
    .from('company_documents')
    .select(`
      *,
      uploader:employees!company_documents_uploaded_by_fkey(id, name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offsetNum, offsetNum + limitNum - 1);

  // Filter by document type
  if (document_type && typeof document_type === 'string') {
    query = query.eq('document_type', document_type);
  }

  // Filter by is_public
  if (is_public !== undefined) {
    query = query.eq('is_public', is_public === 'true');
  }

  // If not admin/hr, only show public documents
  if (profile?.role !== 'admin' && profile?.role !== 'hr') {
    query = query.eq('is_public', true);
  }

  const { data, error, count } = await query;

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(200).json({
    documents: data ?? [],
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
        message: 'Only admin and HR can upload documents'
      }
    });
  }

  const { name, document_type, expiry_date, storage_path, is_public, metadata } = req.body;

  // Validation
  if (!name || !storage_path) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Name and storage path are required' }
    });
  }

  // Create document
  const { data, error } = await supabase
    .from('company_documents')
    .insert({
      name,
      document_type: document_type || null,
      expiry_date: expiry_date || null,
      uploaded_by: userId,
      storage_path,
      is_public: is_public !== undefined ? is_public : false,
      metadata: metadata || null,
    })
    .select(`
      *,
      uploader:employees!company_documents_uploaded_by_fkey(id, name)
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(201).json({
    document: data,
    message: 'Document created successfully',
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient, userId: string) {
  const profile = await getUserProfile(supabase, userId);

  if (!profile || !isAdminOrHr(profile.role)) {
    return res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only admin and HR can delete documents'
      }
    });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Document ID is required' }
    });
  }

  // Get document to delete file from storage
  const { data: document, error: fetchError } = await supabase
    .from('company_documents')
    .select('storage_path')
    .eq('id', id)
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
      // Continue with database deletion even if storage deletion fails
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('company_documents')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: deleteError.message }
    });
  }

  return res.status(200).json({
    message: 'Document deleted successfully',
  });
}
