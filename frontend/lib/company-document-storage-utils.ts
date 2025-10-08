/**
 * Company Document Storage Utilities
 *
 * Provides helper functions for uploading, downloading, and managing
 * company-wide documents in the 'company-documents' Supabase storage bucket.
 */

import { getBrowserClient } from '@/lib/supabase-client';
import {
  StorageError,
  ErrorCode,
  withRetry,
  logError,
} from '@/lib/errors';

// Storage bucket configuration for company documents
export const COMPANY_DOC_STORAGE_CONFIG = {
  BUCKET_NAME: 'company-documents',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB in bytes
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'text/plain',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpeg', '.jpg', '.png', '.gif', '.txt'],
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
 * Validate file before upload for company documents
 */
export function validateCompanyDocumentFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > COMPANY_DOC_STORAGE_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${COMPANY_DOC_STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
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
  const allowedMimeTypes = COMPANY_DOC_STORAGE_CONFIG.ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG, GIF, TXT`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  const allowedExtensions = COMPANY_DOC_STORAGE_CONFIG.ALLOWED_EXTENSIONS as readonly string[];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension is not allowed. Allowed extensions: ${COMPANY_DOC_STORAGE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Generate storage path for a company document
 */
export function generateCompanyDocumentStoragePath(
  userId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(fileName);
  return `${userId}/${timestamp}_${sanitizedFileName}`;
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
 * Upload a file to the 'company-documents' bucket with retry mechanism and cleanup
 */
export async function uploadCompanyDocument(
  file: File,
  userId: string,
  maxRetries: number = 3
): Promise<UploadResult> {
  let storagePath: string | null = null;

  try {
    // Validate file
    const validation = validateCompanyDocumentFile(file);
    if (!validation.valid) {
      throw new StorageError(
        ErrorCode.VALIDATION_FILE_TYPE,
        validation.error || 'Invalid file',
        { fileName: file.name, fileSize: file.size, fileType: file.type }
      );
    }

    // Generate storage path
    storagePath = generateCompanyDocumentStoragePath(userId, file.name);

    // Upload to Supabase Storage with retry logic
    const supabase = getBrowserClient();

    const uploadFn = async () => {
      const { data, error } = await supabase.storage
        .from(COMPANY_DOC_STORAGE_CONFIG.BUCKET_NAME)
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
          context: 'company_doc_storage_upload_retry',
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
      context: 'company_doc_storage_upload_failed',
      userId,
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
          context: 'company_doc_storage_cleanup_failed',
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
      .from(COMPANY_DOC_STORAGE_CONFIG.BUCKET_NAME)
      .remove([storagePath]);
  } catch (error) {
    // Silently fail cleanup - already logging in caller
    console.warn('Failed to cleanup partial upload:', storagePath);
  }
}

/**
 * Get a signed URL for downloading a company document
 */
export async function getCompanyDocumentDownloadUrl(
  storagePath: string
): Promise<DownloadResult> {
  try {
    const supabase = getBrowserClient();
    const { data, error } = await supabase.storage
      .from(COMPANY_DOC_STORAGE_CONFIG.BUCKET_NAME)
      .createSignedUrl(storagePath, COMPANY_DOC_STORAGE_CONFIG.SIGNED_URL_EXPIRY);

    if (error) {
      logError(error, {
        context: 'company_doc_storage_download_url_failed',
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
      context: 'company_doc_storage_download_error',
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
 * Delete a company document from storage
 */
export async function deleteCompanyDocument(storagePath: string): Promise<boolean> {
  try {
    const supabase = getBrowserClient();
    const { error } = await supabase.storage
      .from(COMPANY_DOC_STORAGE_CONFIG.BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      logError(error, {
        context: 'company_doc_storage_delete_failed',
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
      context: 'company_doc_storage_delete_error',
      storagePath,
    });

    return false;
  }
}

/**
 * Save company document metadata to the company_documents table
 */
export async function saveCompanyDocumentMetadata(
  name: string,
  document_type: string,
  expiry_date: string | null,
  uploadedBy: string,
  storagePath: string,
  is_public: boolean
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const supabase = getBrowserClient();

    const { data, error } = await supabase
      .from('company_documents')
      .insert({
        name,
        document_type,
        expiry_date,
        uploaded_by: uploadedBy,
        storage_path: storagePath,
        is_public,
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
 * Upload company document and save metadata in a single transaction
 */
export async function uploadCompanyDocumentWithMetadata(
  file: File,
  userId: string,
  name: string,
  document_type: string,
  expiry_date: string | null,
  is_public: boolean
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    // Upload file to storage
    const uploadResult = await uploadCompanyDocument(file, userId);

    if (!uploadResult.success || !uploadResult.storagePath) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload file',
      };
    }

    // Save metadata to database
    const metadataResult = await saveCompanyDocumentMetadata(
      name,
      document_type,
      expiry_date,
      userId,
      uploadResult.storagePath,
      is_public
    );

    if (!metadataResult.success) {
      // Cleanup: delete uploaded file if metadata save fails
      await deleteCompanyDocument(uploadResult.storagePath);
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
