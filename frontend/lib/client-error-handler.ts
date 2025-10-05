/**
 * Client-Side Error Handler
 * 
 * Provides error handling utilities for client-side operations
 * including redirects, error boundaries, and error recovery.
 */

import { useRouter } from 'next/router'
import { useEffect } from 'react'
import * as React from 'react'
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ErrorCode,
  logError,
} from './errors'
import {
  showErrorToast,
  showAuthError,
  showAuthorizationError,
} from './toast'

// ============================================================================
// Error Redirect Handlers
// ============================================================================

/**
 * Handle 404 errors by redirecting to appropriate page
 */
export function handle404Redirect(router: ReturnType<typeof useRouter>): void {
  logError(new NotFoundError('Page'), {
    path: router.asPath,
    context: 'client_404',
  })
  
  router.push('/404')
}

/**
 * Handle unauthorized access by redirecting to login
 */
export function handleUnauthorizedRedirect(
  router: ReturnType<typeof useRouter>,
  returnUrl?: string
): void {
  const error = new AuthenticationError()
  
  logError(error, {
    path: router.asPath,
    context: 'unauthorized_redirect',
  })
  
  showAuthError(error)
  
  const redirectUrl = returnUrl || router.asPath
  router.push(`/login?returnUrl=${encodeURIComponent(redirectUrl)}`)
}

/**
 * Handle forbidden access by redirecting to dashboard
 */
export function handleForbiddenRedirect(
  router: ReturnType<typeof useRouter>
): void {
  const error = new AuthorizationError()
  
  logError(error, {
    path: router.asPath,
    context: 'forbidden_redirect',
  })
  
  showAuthorizationError(error)
  
  router.push('/dashboard')
}

/**
 * Handle API errors and redirect if necessary
 */
export function handleApiErrorRedirect(
  error: unknown,
  router: ReturnType<typeof useRouter>
): void {
  if (error instanceof AuthenticationError) {
    handleUnauthorizedRedirect(router)
    return
  }
  
  if (error instanceof AuthorizationError) {
    handleForbiddenRedirect(router)
    return
  }
  
  if (error instanceof NotFoundError) {
    handle404Redirect(router)
    return
  }
  
  // For other errors, just show toast
  showErrorToast(error)
}

// ============================================================================
// Error Response Handler
// ============================================================================

/**
 * Handle fetch response errors
 */
export async function handleFetchError(response: Response): Promise<never> {
  let errorData: { 
    message?: string; 
    code?: string; 
    error?: { 
      message?: string; 
      code?: string 
    } 
  }
  
  try {
    errorData = await response.json()
  } catch {
    errorData = { error: { message: response.statusText } }
  }
  
  const errorMessage = errorData?.error?.message || errorData?.message || 'Request failed'
  const errorCode = errorData?.error?.code || ErrorCode.INTERNAL_ERROR
  
  // Map status codes to error types
  switch (response.status) {
    case 401:
      throw new AuthenticationError(errorMessage)
    case 403:
      throw new AuthorizationError(errorMessage)
    case 404:
      throw new NotFoundError('Resource')
    case 400:
      throw new AppError(ErrorCode.VALIDATION_ERROR, errorMessage, 400)
    case 429:
      throw new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, errorMessage, 429)
    default:
      throw new AppError(errorCode as ErrorCode, errorMessage, response.status)
  }
}

/**
 * Fetch wrapper with error handling
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      await handleFetchError(response)
    }
    
    return await response.json()
  } catch (error) {
    // Log the error
    logError(error, {
      context: 'fetch_error',
      url,
      method: options?.method || 'GET',
    })
    
    throw error
  }
}

// ============================================================================
// React Hook for Error Handling
// ============================================================================

/**
 * Hook to handle errors with automatic redirects
 */
export function useErrorHandler() {
  const router = useRouter()
  
  const handleError = (error: unknown, showToast: boolean = true) => {
    // Log the error
    logError(error, {
      context: 'use_error_handler',
      path: router.asPath,
    })
    
    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      handleUnauthorizedRedirect(router)
      return
    }
    
    // Handle authorization errors
    if (error instanceof AuthorizationError) {
      handleForbiddenRedirect(router)
      return
    }
    
    // Handle not found errors
    if (error instanceof NotFoundError) {
      handle404Redirect(router)
      return
    }
    
    // Show toast for other errors
    if (showToast) {
      showErrorToast(error)
    }
  }
  
  return { handleError }
}

// ============================================================================
// Authorization Check Hook
// ============================================================================

/**
 * Hook to check authorization and redirect if unauthorized
 */
export function useRequireAuth(
  isAuthenticated: boolean,
  isLoading: boolean = false
) {
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      handleUnauthorizedRedirect(router)
    }
  }, [isAuthenticated, isLoading, router])
}

/**
 * Hook to check role-based authorization
 */
export function useRequireRole(
  userRole: string | undefined,
  allowedRoles: string[],
  isLoading: boolean = false
) {
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && userRole && !allowedRoles.includes(userRole)) {
      handleForbiddenRedirect(router)
    }
  }, [userRole, allowedRoles, isLoading, router])
}

// ============================================================================
// Error Boundary Helpers
// ============================================================================

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export function getErrorBoundaryState(error: Error | null): ErrorBoundaryState {
  return {
    hasError: !!error,
    error,
  }
}

export function resetErrorBoundary(): ErrorBoundaryState {
  return {
    hasError: false,
    error: null,
  }
}

/**
 * Log error from error boundary
 */
export function logErrorBoundary(
  error: Error,
  errorInfo: React.ErrorInfo
): void {
  logError(error, {
    context: 'error_boundary',
    componentStack: errorInfo.componentStack || 'No stack trace available',
  })
}

// ============================================================================
// Form Error Helpers
// ============================================================================

/**
 * Extract field errors from validation error
 */
export function extractFieldErrors(
  error: unknown
): Record<string, string> | null {
  if (error instanceof AppError && error.details) {
    return error.details as Record<string, string>
  }
  return null
}

/**
 * Format error message for form display
 */
export function formatFormError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// ============================================================================
// Network Error Detection
// ============================================================================

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError'
    )
  }
  return false
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.code === ErrorCode.TIMEOUT_ERROR
  }
  
  if (error instanceof Error) {
    return error.message.includes('timeout') || error.name === 'TimeoutError'
  }
  
  return false
}

// ============================================================================
// Retry Helpers
// ============================================================================

export interface RetryConfig {
  maxRetries: number
  delayMs: number
  onRetry?: (attempt: number) => void
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const { maxRetries, delayMs, onRetry } = config
  let lastError: unknown
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry on certain errors
      if (
        error instanceof AuthenticationError ||
        error instanceof AuthorizationError ||
        error instanceof NotFoundError
      ) {
        throw error
      }
      
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt)
        onRetry?.(attempt + 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}
