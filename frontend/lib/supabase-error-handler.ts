import { PostgrestError } from '@supabase/supabase-js'

export interface SupabaseErrorInfo {
  code: string
  message: string
  details?: string
  hint?: string
  userMessage: string
  retryable: boolean
  severity: 'low' | 'medium' | 'high'
}

/**
 * Enhanced Supabase error handler with production-ready error mapping
 */
export class SupabaseErrorHandler {
  private static errorMap: Record<string, Partial<SupabaseErrorInfo>> = {
    // Authentication errors
    'invalid_credentials': {
      userMessage: 'Invalid email or password. Please check your credentials and try again.',
      retryable: true,
      severity: 'medium'
    },
    'email_not_confirmed': {
      userMessage: 'Please check your email and click the confirmation link before signing in.',
      retryable: false,
      severity: 'medium'
    },
    'signup_disabled': {
      userMessage: 'Account registration is currently disabled. Please contact support.',
      retryable: false,
      severity: 'high'
    },
    'email_address_invalid': {
      userMessage: 'Please enter a valid email address.',
      retryable: true,
      severity: 'low'
    },
    'password_too_short': {
      userMessage: 'Password must be at least 6 characters long.',
      retryable: true,
      severity: 'low'
    },

    // Database errors (PostgreSQL error codes)
    'PGRST116': {
      userMessage: 'No data found matching your request.',
      retryable: false,
      severity: 'low'
    },
    'PGRST301': {
      userMessage: 'You don\'t have permission to access this resource.',
      retryable: false,
      severity: 'high'
    },
    '23505': {
      userMessage: 'This record already exists. Please use different values.',
      retryable: true,
      severity: 'medium'
    },
    '23503': {
      userMessage: 'Cannot delete this record because it\'s referenced by other data.',
      retryable: false,
      severity: 'medium'
    },
    '23502': {
      userMessage: 'Required information is missing. Please fill in all required fields.',
      retryable: true,
      severity: 'medium'
    },
    '42501': {
      userMessage: 'Access denied. You don\'t have permission to perform this action.',
      retryable: false,
      severity: 'high'
    },

    // Network and connection errors
    'network_error': {
      userMessage: 'Network connection failed. Please check your internet connection and try again.',
      retryable: true,
      severity: 'medium'
    },
    'timeout': {
      userMessage: 'Request timed out. Please try again.',
      retryable: true,
      severity: 'medium'
    },
    'rate_limit_exceeded': {
      userMessage: 'Too many requests. Please wait a moment and try again.',
      retryable: true,
      severity: 'medium'
    },

    // Generic errors
    'internal_server_error': {
      userMessage: 'An internal error occurred. Please try again or contact support if the problem persists.',
      retryable: true,
      severity: 'high'
    }
  }

  /**
   * Handle Supabase error and return user-friendly information
   */
  static handleError(error: unknown): SupabaseErrorInfo {
    // Handle PostgrestError
    if (this.isPostgrestError(error)) {
      return this.handlePostgrestError(error)
    }

    // Handle Auth errors
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      const authError = this.handleAuthError(error as { message: string })
      if (authError) {
        return authError
      }
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error)
    }

    // Generic error fallback
    return this.handleGenericError(error)
  }

  /**
   * Handle PostgrestError (database errors)
   */
  private static handlePostgrestError(error: PostgrestError): SupabaseErrorInfo {
    const code = error.code || 'unknown'
    const mapping = this.errorMap[code] || {}

    return {
      code,
      message: error.message,
      details: error.details || undefined,
      hint: error.hint || undefined,
      userMessage: mapping.userMessage || 'A database error occurred. Please try again.',
      retryable: mapping.retryable ?? false,
      severity: mapping.severity || 'medium'
    }
  }

  /**
   * Handle authentication errors
   */
  private static handleAuthError(error: { message: string }): SupabaseErrorInfo | null {
    const message = error.message.toLowerCase()
    
    // Map common auth error messages to codes
    let code = 'auth_error'
    
    if (message.includes('invalid') && message.includes('credentials')) {
      code = 'invalid_credentials'
    } else if (message.includes('email') && message.includes('not') && message.includes('confirmed')) {
      code = 'email_not_confirmed'
    } else if (message.includes('signup') && message.includes('disabled')) {
      code = 'signup_disabled'
    } else if (message.includes('email') && message.includes('invalid')) {
      code = 'email_address_invalid'
    } else if (message.includes('password') && message.includes('short')) {
      code = 'password_too_short'
    }

    const mapping = this.errorMap[code] || {}

    return {
      code,
      message: error.message,
      userMessage: mapping.userMessage || 'Authentication failed. Please try again.',
      retryable: mapping.retryable ?? true,
      severity: mapping.severity || 'medium'
    }
  }

  /**
   * Handle network errors
   */
  private static handleNetworkError(error: unknown): SupabaseErrorInfo {
    let code = 'network_error'
    
    const errorObj = error as { name?: string; message?: string; status?: number }
    
    if (errorObj.name === 'AbortError' || errorObj.message?.includes('timeout')) {
      code = 'timeout'
    } else if (errorObj.status === 429) {
      code = 'rate_limit_exceeded'
    }

    const mapping = this.errorMap[code] || {}

    return {
      code,
      message: errorObj.message || 'Network error',
      userMessage: mapping.userMessage || 'Network connection failed. Please try again.',
      retryable: mapping.retryable ?? true,
      severity: mapping.severity || 'medium'
    }
  }

  /**
   * Handle generic errors
   */
  private static handleGenericError(error: unknown): SupabaseErrorInfo {
    const errorObj = error as { message?: string }
    return {
      code: 'unknown_error',
      message: errorObj.message || 'Unknown error',
      userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      retryable: true,
      severity: 'medium'
    }
  }

  /**
   * Check if error is a PostgrestError
   */
  private static isPostgrestError(error: unknown): error is PostgrestError {
    return !!(error && typeof error === 'object' && 'code' in error && 'message' in error)
  }

  /**
   * Check if error is a network error
   */
  private static isNetworkError(error: unknown): boolean {
    const errorObj = error as { name?: string; code?: string; status?: number }
    return (
      error instanceof TypeError ||
      errorObj.name === 'NetworkError' ||
      errorObj.name === 'AbortError' ||
      errorObj.code === 'NETWORK_ERROR' ||
      !!(errorObj.status && errorObj.status >= 500)
    )
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(errorInfo: SupabaseErrorInfo, attempt: number): number {
    if (!errorInfo.retryable) {
      return 0
    }

    // Exponential backoff with jitter
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() - 0.5)
    
    return Math.max(0, delay + jitter)
  }

  /**
   * Check if error should trigger user notification
   */
  static shouldNotifyUser(errorInfo: SupabaseErrorInfo): boolean {
    return errorInfo.severity === 'high' || !errorInfo.retryable
  }

  /**
   * Format error for logging (removes sensitive information)
   */
  static formatForLogging(error: unknown, errorInfo: SupabaseErrorInfo): Record<string, unknown> {
    return {
      code: errorInfo.code,
      message: errorInfo.message,
      severity: errorInfo.severity,
      retryable: errorInfo.retryable,
      timestamp: new Date().toISOString(),
      // Don't log sensitive details in production
      ...(process.env.NODE_ENV === 'development' && {
        details: errorInfo.details,
        hint: errorInfo.hint,
        originalError: error
      })
    }
  }
}

/**
 * Convenience function for handling Supabase errors
 */
export function handleSupabaseError(error: unknown): SupabaseErrorInfo {
  return SupabaseErrorHandler.handleError(error)
}

/**
 * Hook for handling Supabase errors in React components
 */
export function useSupabaseErrorHandler() {
  const handleError = (error: unknown) => {
    const errorInfo = SupabaseErrorHandler.handleError(error)
    
    // Log error for monitoring
    console.error('Supabase Error:', SupabaseErrorHandler.formatForLogging(error, errorInfo))
    
    return errorInfo
  }

  return { handleError }
}