'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBrowserClient } from '@/lib/supabase-client'
import type { LeaveDocument, LeaveWithDocuments } from '@/types'

const supabase = getBrowserClient()

interface UseLeaveDocumentsOptions {
  leaveRequestId?: string
  enabled?: boolean
}

/**
 * Hook to fetch leave documents with their associated leave request data
 * Uses React Query with 5-minute stale time caching
 */
export function useLeaveDocuments(options?: UseLeaveDocumentsOptions) {
  const { leaveRequestId, enabled = true } = options || {}

  return useQuery<LeaveDocument[], Error>({
    queryKey: ['leave-documents', leaveRequestId],
    queryFn: async () => {
      let query = supabase
        .from('leave_documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (leaveRequestId) {
        query = query.eq('leave_request_id', leaveRequestId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook to fetch leave requests with their associated documents
 * Performs a JOIN between leave_requests and leave_documents
 */
export function useLeaveWithDocuments(leaveRequestId: string, enabled = true) {
  return useQuery<LeaveWithDocuments, Error>({
    queryKey: ['leave-with-documents', leaveRequestId],
    queryFn: async () => {
      // Fetch leave request with relations
      const { data: leaveData, error: leaveError } = await supabase
        .from('leaves')
        .select(`
          *,
          requester:employees!leaves_requester_id_fkey(id, name, role, department),
          leave_type:leave_types(id, name, description, default_allocation_days, is_active)
        `)
        .eq('id', leaveRequestId)
        .single()

      if (leaveError) {
        throw new Error(leaveError.message)
      }

      // Fetch associated documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('leave_documents')
        .select('*')
        .eq('leave_request_id', leaveRequestId)
        .order('created_at', { ascending: false })

      if (documentsError) {
        throw new Error(documentsError.message)
      }

      return {
        ...leaveData,
        documents: documentsData || [],
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

interface UploadDocumentPayload {
  leaveRequestId: string
  file: File
}

/**
 * Hook to upload a document to Supabase Storage and create metadata record
 */
export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation<LeaveDocument, Error, UploadDocumentPayload>({
    mutationFn: async ({ leaveRequestId, file }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create storage path
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${user.id}/${leaveRequestId}/${timestamp}_${sanitizedFileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('leave-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Create metadata record
      const { data: documentData, error: dbError } = await supabase
        .from('leave_documents')
        .insert({
          leave_request_id: leaveRequestId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: storagePath,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('leave-documents')
          .remove([storagePath])
        
        throw new Error(`Failed to save document metadata: ${dbError.message}`)
      }

      return documentData
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['leave-documents'] })
      queryClient.invalidateQueries({ queryKey: ['leave-with-documents', data.leave_request_id] })
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to delete a document from storage and database
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (documentId: string) => {
      // Get document details
      const { data: document, error: fetchError } = await supabase
        .from('leave_documents')
        .select('storage_path, leave_request_id')
        .eq('id', documentId)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch document: ${fetchError.message}`)
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('leave-documents')
        .remove([document.storage_path])

      if (storageError) {
        throw new Error(`Failed to delete file: ${storageError.message}`)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('leave_documents')
        .delete()
        .eq('id', documentId)

      if (dbError) {
        throw new Error(`Failed to delete document record: ${dbError.message}`)
      }
    },
    onSuccess: (_, documentId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['leave-documents'] })
      queryClient.invalidateQueries({ queryKey: ['leave-with-documents'] })
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to download a document with a signed URL
 */
export function useDownloadDocument() {
  return useMutation<string, Error, string>({
    mutationFn: async (documentId: string) => {
      // Get document details
      const { data: document, error: fetchError } = await supabase
        .from('leave_documents')
        .select('storage_path, file_name')
        .eq('id', documentId)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch document: ${fetchError.message}`)
      }

      // Create signed URL (1 hour expiry)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('leave-documents')
        .createSignedUrl(document.storage_path, 3600)

      if (urlError) {
        throw new Error(`Failed to create download URL: ${urlError.message}`)
      }

      return signedUrlData.signedUrl
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}
