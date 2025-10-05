/**
 * Toast Notification Utilities
 * 
 * Provides enhanced toast notification functions with error handling support.
 * Wraps the UI toast component with additional functionality.
 */

import { toast as baseToast } from 'sonner'
import { getUserFriendlyMessage, ErrorCode, type AppError } from './errors'

// ============================================================================
// Toast Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  }
}

// ============================================================================
// Enhanced Toast Functions
// ============================================================================

export const toast = {
  /**
   * Show success toast
   */
  success: (message: string, options?: ToastOptions) => {
    return baseToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
    })
  },

  /**
   * Show error toast
   */
  error: (message: string, options?: ToastOptions) => {
    return baseToast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action,
      cancel: options?.cancel,
    })
  },

  /**
   * Show warning toast
   */
  warning: (message: string, options?: ToastOptions) => {
    return baseToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
      cancel: options?.cancel,
    })
  },

  /**
   * Show info toast
   */
  info: (message: string, options?: ToastOptions) => {
    return baseToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
    })
  },

  /**
   * Show loading toast
   */
  loading: (message: string, options?: Omit<ToastOptions, 'duration'>) => {
    return baseToast.loading(message, {
      description: options?.description,
    })
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    return baseToast.dismiss(toastId)
  },

  /**
   * Show promise toast with loading, success, and error states
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    return baseToast.promise(promise, messages)
  },
}

// ============================================================================
// Error-Specific Toast Functions
// ============================================================================

/**
 * Show toast for an error with user-friendly message
 */
export function showErrorToast(error: unknown, fallbackMessage?: string): void {
  const message = getUserFriendlyMessage(error)
  const description = fallbackMessage || getErrorDescription(error)

  toast.error(message, {
    description,
    duration: 6000,
  })
}

/**
 * Show toast for file upload errors
 */
export function showFileUploadError(error: unknown): void {
  const message = getUserFriendlyMessage(error)
  
  toast.error('Upload Failed', {
    description: message,
    duration: 6000,
    action: {
      label: 'Retry',
      onClick: () => {
        // Retry logic should be handled by the component
        toast.info('Please try uploading again')
      },
    },
  })
}

/**
 * Show toast for validation errors
 */
export function showValidationError(
  field: string,
  message: string
): void {
  toast.error('Validation Error', {
    description: `${field}: ${message}`,
    duration: 5000,
  })
}

/**
 * Show toast for authentication errors
 */
export function showAuthError(error: unknown): void {
  const message = getUserFriendlyMessage(error)
  
  toast.error('Authentication Error', {
    description: message,
    duration: 6000,
    action: {
      label: 'Login',
      onClick: () => {
        window.location.href = '/login'
      },
    },
  })
}

/**
 * Show toast for authorization errors
 */
export function showAuthorizationError(error: unknown): void {
  const message = getUserFriendlyMessage(error)
  
  toast.error('Access Denied', {
    description: message,
    duration: 6000,
  })
}

/**
 * Show toast for storage errors
 */
export function showStorageError(error: unknown, action?: 'upload' | 'download' | 'delete'): void {
  const message = getUserFriendlyMessage(error)
  const actionText = action ? ` ${action}` : ''
  
  toast.error(`Storage Error`, {
    description: message,
    duration: 6000,
    action: action === 'upload' ? {
      label: 'Retry',
      onClick: () => {
        toast.info('Please try again')
      },
    } : undefined,
  })
}

/**
 * Show toast for network errors
 */
export function showNetworkError(): void {
  toast.error('Network Error', {
    description: 'Please check your internet connection and try again',
    duration: 6000,
    action: {
      label: 'Retry',
      onClick: () => {
        window.location.reload()
      },
    },
  })
}

/**
 * Show toast for database errors
 */
export function showDatabaseError(error: unknown): void {
  const message = getUserFriendlyMessage(error)
  
  toast.error('Database Error', {
    description: message,
    duration: 6000,
  })
}

// ============================================================================
// Success Toast Helpers
// ============================================================================

export function showSuccessToast(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 4000,
  })
}

export function showLeaveRequestSuccess(action: 'created' | 'updated' | 'deleted'): void {
  const messages = {
    created: 'Leave request submitted successfully',
    updated: 'Leave request updated successfully',
    deleted: 'Leave request deleted successfully',
  }

  toast.success(messages[action], {
    duration: 4000,
  })
}

export function showApprovalSuccess(action: 'approved' | 'rejected'): void {
  const messages = {
    approved: 'Leave request approved successfully',
    rejected: 'Leave request rejected successfully',
  }

  toast.success(messages[action], {
    duration: 4000,
  })
}

export function showDocumentSuccess(action: 'uploaded' | 'deleted'): void {
  const messages = {
    uploaded: 'Document uploaded successfully',
    deleted: 'Document deleted successfully',
  }

  toast.success(messages[action], {
    duration: 4000,
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

function getErrorDescription(error: unknown): string | undefined {
  if (error instanceof Error && 'details' in error) {
    const details = (error as AppError).details
    if (details && typeof details === 'object') {
      return Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    }
  }
  return undefined
}

/**
 * Show a toast with custom retry logic
 */
export function showRetryableError(
  error: unknown,
  onRetry: () => void | Promise<void>
): void {
  const message = getUserFriendlyMessage(error)
  
  toast.error('Operation Failed', {
    description: message,
    duration: 8000,
    action: {
      label: 'Retry',
      onClick: async () => {
        try {
          await onRetry()
        } catch (retryError) {
          showErrorToast(retryError)
        }
      },
    },
  })
}

/**
 * Show a loading toast that can be updated
 */
export function showLoadingToast(message: string): string | number {
  return toast.loading(message)
}

/**
 * Update a loading toast to success
 */
export function updateToastSuccess(
  toastId: string | number,
  message: string,
  description?: string
): void {
  toast.dismiss(toastId)
  toast.success(message, { description })
}

/**
 * Update a loading toast to error
 */
export function updateToastError(
  toastId: string | number,
  error: unknown
): void {
  toast.dismiss(toastId)
  showErrorToast(error)
}
