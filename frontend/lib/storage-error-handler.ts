getModuleBuildInfo; /**
 * Storage Error Handler
 *
 * Provides specialized error handling for file upload/download operations
 * with cleanup for partial uploads and retry mechanisms.
 */

import { getBrowserClient } from "@/lib/supabase-client";
import {
  AppError,
  StorageError,
  ErrorCode,
  logError,
  withRetry,
  type RetryOptions,
} from "./errors";
import {
  showFileUploadError,
  showStorageError,
  showRetryableError,
  showLoadingToast,
  updateToastSuccess,
  updateToastError,
} from "./toast";
import { getModuleBuildInfo } from "next/dist/build/webpack/loaders/get-module-build-info";

// ============================================================================
// Storage Error Types
// ============================================================================

export interface UploadResult {
  path: string;
  url?: string;
  error?: Error;
}

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  onProgress?: (progress: number) => void;
  retryConfig?: Partial<RetryOptions>;
}

export interface CleanupOptions {
  bucket: string;
  paths: string[];
}

// ============================================================================
// Upload with Error Handling
// ============================================================================

/**
 * Upload file with comprehensive error handling and cleanup
 */
export async function uploadFileWithErrorHandling(
  options: UploadOptions
): Promise<UploadResult> {
  const { bucket, path, file, onProgress, retryConfig } = options;
  const supabase = getBrowserClient();

  let uploadedPath: string | null = null;

  try {
    // Validate file before upload
    if (!file || file.size === 0) {
      throw new StorageError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid file: file is empty or missing"
      );
    }

    // Upload with retry logic
    const uploadFn = async () => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw handleStorageError(error);
      }

      if (!data?.path) {
        throw new StorageError(
          ErrorCode.STORAGE_UPLOAD_FAILED,
          "Upload succeeded but no path returned"
        );
      }

      uploadedPath = data.path;
      onProgress?.(100);

      return data;
    };

    const data = await withRetry(uploadFn, {
      maxRetries: retryConfig?.maxRetries || 2,
      delayMs: retryConfig?.delayMs || 1000,
      backoff: "exponential",
      onRetry: (attempt, error) => {
        logError(error, {
          context: "storage_upload_retry",
          attempt,
          bucket,
          path,
          fileName: file.name,
        });
        onProgress?.(0); // Reset progress on retry
      },
    });

    // Get public URL if needed
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData?.publicUrl,
    };
  } catch (error) {
    // Cleanup partial upload on error
    if (uploadedPath) {
      await cleanupPartialUpload({ bucket, paths: [uploadedPath] });
    }

    // Log the error
    logError(error, {
      context: "storage_upload_failed",
      bucket,
      path,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // Show user-friendly error
    showFileUploadError(error);

    return {
      path: "",
      error: error instanceof Error ? error : new Error("Upload failed"),
    };
  }
}

/**
 * Upload multiple files with error handling
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  pathPrefix: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const uploadedPaths: string[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const timestamp = Date.now();
      const sanitizedName = sanitizeFileName(file.name);
      const path = `${pathPrefix}/${timestamp}_${sanitizedName}`;

      const result = await uploadFileWithErrorHandling({
        bucket,
        path,
        file,
        onProgress: (progress) => onProgress?.(i, progress),
      });

      results.push(result);

      if (result.path) {
        uploadedPaths.push(result.path);
      } else {
        // If one upload fails, cleanup all previous uploads
        throw new StorageError(
          ErrorCode.STORAGE_UPLOAD_FAILED,
          `Failed to upload ${file?.name || 'unknown file'}`
        );
      }
    }

    return results;
  } catch (error) {
    // Cleanup all uploaded files on error
    if (uploadedPaths.length > 0) {
      await cleanupPartialUpload({ bucket, paths: uploadedPaths });
    }

    logError(error, {
      context: "multiple_upload_failed",
      bucket,
      pathPrefix,
      filesCount: files.length,
      uploadedCount: uploadedPaths.length,
    });

    throw error;
  }
}

// ============================================================================
// Download with Error Handling
// ============================================================================

/**
 * Download file with error handling
 */
export async function downloadFileWithErrorHandling(
  bucket: string,
  path: string,
  fileName?: string
): Promise<void> {
  const supabase = getBrowserClient();
  const toastId = showLoadingToast("Downloading file...");

  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      throw handleStorageError(error);
    }

    if (!data) {
      throw new StorageError(
        ErrorCode.STORAGE_DOWNLOAD_FAILED,
        "Download succeeded but no data returned"
      );
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || path.split("/").pop() || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    updateToastSuccess(toastId, "File downloaded successfully");
  } catch (error) {
    logError(error, {
      context: "storage_download_failed",
      bucket,
      path,
    });

    updateToastError(toastId, error);
    throw error;
  }
}

/**
 * Get signed URL with error handling
 */
export async function getSignedUrlWithErrorHandling(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = getBrowserClient();

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw handleStorageError(error);
    }

    if (!data?.signedUrl) {
      throw new StorageError(
        ErrorCode.STORAGE_DOWNLOAD_FAILED,
        "Failed to generate signed URL"
      );
    }

    return data.signedUrl;
  } catch (error) {
    logError(error, {
      context: "signed_url_failed",
      bucket,
      path,
      expiresIn,
    });

    showStorageError(error, "download");
    throw error;
  }
}

// ============================================================================
// Delete with Error Handling
// ============================================================================

/**
 * Delete file with error handling
 */
export async function deleteFileWithErrorHandling(
  bucket: string,
  path: string
): Promise<void> {
  const supabase = getBrowserClient();

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw handleStorageError(error);
    }
  } catch (error) {
    logError(error, {
      context: "storage_delete_failed",
      bucket,
      path,
    });

    showStorageError(error, "delete");
    throw error;
  }
}

/**
 * Delete multiple files with error handling
 */
export async function deleteMultipleFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  const supabase = getBrowserClient();

  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      throw handleStorageError(error);
    }
  } catch (error) {
    logError(error, {
      context: "multiple_delete_failed",
      bucket,
      pathsCount: paths.length,
    });

    throw error;
  }
}

// ============================================================================
// Cleanup Helpers
// ============================================================================

/**
 * Cleanup partial uploads on error
 */
export async function cleanupPartialUpload(
  options: CleanupOptions
): Promise<void> {
  const { bucket, paths } = options;

  if (paths.length === 0) {
    return;
  }

  try {
    await deleteMultipleFiles(bucket, paths);

    logError(new Error("Cleaned up partial uploads"), {
      context: "cleanup_partial_upload",
      bucket,
      pathsCount: paths.length,
    });
  } catch (error) {
    // Log cleanup failure but don't throw
    logError(error, {
      context: "cleanup_failed",
      bucket,
      pathsCount: paths.length,
    });
  }
}

// ============================================================================
// Error Mapping
// ============================================================================

/**
 * Map Supabase storage errors to app errors
 */
function handleStorageError(error: unknown): StorageError {
  const message = (error as { message?: string })?.message || "Storage operation failed";

  // Bucket not found
  if (message.includes("Bucket not found")) {
    return new StorageError(
      ErrorCode.STORAGE_BUCKET_NOT_FOUND,
      "Storage location not found",
      { originalError: error }
    );
  }

  // File not found
  if (message.includes("not found") || (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: string }).statusCode === "404")) {
    return new StorageError(ErrorCode.DATABASE_NOT_FOUND, "File not found", {
      originalError: error,
    });
  }

  // Quota exceeded
  if (message.includes("quota") || message.includes("limit")) {
    return new StorageError(
      ErrorCode.STORAGE_QUOTA_EXCEEDED,
      "Storage quota exceeded",
      { originalError: error }
    );
  }

  // Permission denied
  if (message.includes("permission") || (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: string }).statusCode === "403")) {
    return new StorageError(
      ErrorCode.AUTH_FORBIDDEN,
      "Permission denied for storage operation",
      { originalError: error }
    );
  }

  // Generic storage error
  return new StorageError(ErrorCode.STORAGE_UPLOAD_FAILED, message, {
    originalError: error,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sanitize file name for storage
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

/**
 * Generate unique file path
 */
export function generateFilePath(
  userId: string,
  leaveRequestId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitized = sanitizeFileName(fileName);
  return `${userId}/${leaveRequestId}/${timestamp}_${sanitized}`;
}

/**
 * Extract file name from path
 */
export function extractFileName(path: string): string {
  const parts = path.split("/");
  const fileNameWithTimestamp = parts[parts.length - 1];
  if (!fileNameWithTimestamp) return "";
  // Remove timestamp prefix (e.g., "1234567890_filename.pdf" -> "filename.pdf")
  return fileNameWithTimestamp.replace(/^\d+_/, "");
}
