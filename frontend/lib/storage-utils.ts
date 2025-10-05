/**
 * Storage Utilities for Leave Documents
 * 
 * Provides helper functions for uploading, downloading, and managing
 * documents in the leave-documents Supabase storage bucket.
 */

import { getBrowserClient } from '@/lib/supabase-client';
import {
  StorageError,
  ErrorCode,
  withRetry,
  logError,
} from '@/lib/errors';

// Storage bucket configuration
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'leave-documents',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  SIGNED_URL_EXPIRY: 3600, // 1 hour in seconds
} as const;

// File validation result
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// Upload result
export interface UploadResult {
  success: boolean;
  storagePath?: string;
  error?: string;
}

// Download result
export interface DownloadResult {
  success: boolean;
  signedUrl?: string;
  error?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file size is not zero
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  // Check MIME type
  const allowedMimeTypes = STORAGE_CONFIG.ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: PDF, JPEG, PNG, DOC, DOCX`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  const allowedExtensions = STORAGE_CONFIG.ALLOWED_EXTENSIONS as readonly string[];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension is not allowed. Allowed extensions: ${STORAGE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Generate storage path for a file
 */
export function generateStoragePath(
  userId: string,
  leaveRequestId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(fileName);
  return `${userId}/${leaveRequestId}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Sanitize file name to prevent path traversal and special characters
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and special characters
  return fileName
    .replace(/\.\./g, '__') // Replace .. to prevent path traversal
    .replace(/[/\\]/g, '_') // Replace path separators
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '_') // Replace leading dots
    .substring(0, 255); // Limit length
}

/**
 * Upload a file to the leave-documents bucket with retry mechanism and cleanup
 */
export async function uploadDocument(
  file: File,
  userId: string,
  leaveRequestId: string,
  maxRetries: number = 3
): Promise<UploadResult> {
  let storagePath: string | null = null;
  
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new StorageError(
        ErrorCode.VALIDATION_FILE_TYPE,
        validation.error || 'Invalid file',
        { fileName: file.name, fileSize: file.size, fileType: file.type }
      );
    }

    // Generate storage path
    storagePath = generateStoragePath(userId, leaveRequestId, file.name);

    // Upload to Supabase Storage with retry logic
    const supabase = getBrowserClient();
    
    const uploadFn = async () => {
      const { data, error } = await supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .upload(storagePath!, file, {
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        // Handle specific storage errors
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          throw new StorageError(
            ErrorCode.STORAGE_UPLOAD_FAILED,
            'A file with this name already exists',
            { storagePath, originalError: error.message }
          );
        }
        
        if (error.message?.includes('quota') || error.message?.includes('limit')) {
          throw new StorageError(
            ErrorCode.STORAGE_QUOTA_EXCEEDED,
            'Storage quota exceeded',
            { storagePath, originalError: error.message }
          );
        }
        
        if (error.message?.includes('bucket') || error.message?.includes('not found')) {
          throw new StorageError(
            ErrorCode.STORAGE_BUCKET_NOT_FOUND,
            'Storage bucket not configured',
            { storagePath, originalError: error.message }
          );
        }
        
        throw new StorageError(
          ErrorCode.STORAGE_UPLOAD_FAILED,
          error.message || 'Failed to upload file',
          { storagePath, originalError: error.message }
        );
      }

      return data;
    };

    // Use retry logic with exponential backoff
    const data = await withRetry(uploadFn, {
      maxRetries,
      delayMs: 1000,
      backoff: 'exponential',
      onRetry: (attempt, error) => {
        logError(error, {
          context: 'storage_upload_retry',
          attempt,
          storagePath,
          fileName: file.name,
        });
      },
    });

    return {
      success: true,
      storagePath: data.path,
    };
  } catch (error) {
    // Log the error
    logError(error, {
      context: 'storage_upload_failed',
      userId,
      leaveRequestId,
      fileName: file.name,
      fileSize: file.size,
      storagePath,
    });

    // Cleanup partial upload if it exists
    if (storagePath) {
      try {
        await cleanupPartialUpload(storagePath);
      } catch (cleanupError) {
        logError(cleanupError, {
          context: 'storage_cleanup_failed',
          storagePath,
        });
      }
    }

    // Return error result
    if (error instanceof StorageError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Cleanup partial upload (helper function)
 */
async function cleanupPartialUpload(storagePath: string): Promise<void> {
  try {
    const supabase = getBrowserClient();
    await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove([storagePath]);
  } catch (error) {
    // Silently fail cleanup - already logging in caller
    console.warn('Failed to cleanup partial upload:', storagePath);
  }
}

/**
 * Get a signed URL for downloading a document
 */
export async function getDocumentDownloadUrl(
  storagePath: string
): Promise<DownloadResult> {
  try {
    const supabase = getBrowserClient();
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .createSignedUrl(storagePath, STORAGE_CONFIG.SIGNED_URL_EXPIRY);

    if (error) {
      logError(error, {
        context: 'storage_download_url_failed',
        storagePath,
      });
      
      throw new StorageError(
        ErrorCode.STORAGE_DOWNLOAD_FAILED,
        error.message || 'Failed to generate download URL',
        { storagePath, originalError: error.message }
      );
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    };
  } catch (error) {
    logError(error, {
      context: 'storage_download_error',
      storagePath,
    });
    
    return {
      success: false,
      error: error instanceof StorageError 
        ? error.message 
        : 'Failed to generate download URL',
    };
  }
}

/**
 * Delete a document from storage
 */
export async function deleteDocument(storagePath: string): Promise<boolean> {
  try {
    const supabase = getBrowserClient();
    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      logError(error, {
        context: 'storage_delete_failed',
        storagePath,
      });
      
      throw new StorageError(
        ErrorCode.STORAGE_DELETE_FAILED,
        error.message || 'Failed to delete document',
        { storagePath, originalError: error.message }
      );
    }

    return true;
  } catch (error) {
    logError(error, {
      context: 'storage_delete_error',
      storagePath,
    });
    
    return false;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file type icon name (for Lucide React icons)
 */
export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'FileImage';
  if (mimeType === 'application/pdf') return 'FileText';
  if (
    mimeType === 'application/msword' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'FileText';
  }
  return 'File';
}

/**
 * Check if user can upload documents (must be authenticated)
 */
export async function canUploadDocuments(): Promise<boolean> {
  try {
    const supabase = getBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Get storage bucket public URL (for reference, not for direct access)
 */
export function getStorageBucketUrl(): string {
  const supabase = getBrowserClient();
  return `${supabase.storage.from(STORAGE_CONFIG.BUCKET_NAME).getPublicUrl('').data.publicUrl}`;
}

/**
 * Save document metadata to the leave_documents table
 */
export async function saveDocumentMetadata(
  leaveRequestId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  storagePath: string,
  uploadedBy: string
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const supabase = getBrowserClient();
    
    const { data, error } = await supabase
      .from('leave_documents')
      .insert({
        leave_request_id: leaveRequestId,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        storage_path: storagePath,
        uploaded_by: uploadedBy,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return {
        success: false,
        error: error.message || 'Failed to save document metadata',
      };
    }

    return {
      success: true,
      documentId: data.id,
    };
  } catch (error) {
    console.error('Save metadata error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload document and save metadata in a single transaction
 */
export async function uploadDocumentWithMetadata(
  file: File,
  userId: string,
  leaveRequestId: string
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    // Upload file to storage
    const uploadResult = await uploadDocument(file, userId, leaveRequestId);
    
    if (!uploadResult.success || !uploadResult.storagePath) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload file',
      };
    }

    // Save metadata to database
    const metadataResult = await saveDocumentMetadata(
      leaveRequestId,
      file.name,
      file.size,
      file.type,
      uploadResult.storagePath,
      userId
    );

    if (!metadataResult.success) {
      // Cleanup: delete uploaded file if metadata save fails
      await deleteDocument(uploadResult.storagePath);
      return {
        success: false,
        error: metadataResult.error || 'Failed to save document metadata',
      };
    }

    return {
      success: true,
      documentId: metadataResult.documentId,
    };
  } catch (error) {
    console.error('Upload with metadata error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
