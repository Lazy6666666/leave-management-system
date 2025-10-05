/**
 * Error Handling Utilities
 * 
 * Provides standardized error types, error handling functions,
 * and error logging for both client and server-side code.
 */

// ============================================================================
// Error Types and Codes
// ============================================================================

export enum ErrorCode {
  // Authentication & Authorization
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VALIDATION_FILE_TYPE = 'VALIDATION_FILE_TYPE',
  VALIDATION_FILE_SIZE = 'VALIDATION_FILE_SIZE',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_DATE = 'VALIDATION_INVALID_DATE',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_NOT_FOUND = 'DATABASE_NOT_FOUND',
  DATABASE_CONSTRAINT = 'DATABASE_CONSTRAINT',
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  
  // Storage
  STORAGE_UPLOAD_FAILED = 'STORAGE_UPLOAD_FAILED',
  STORAGE_DOWNLOAD_FAILED = 'STORAGE_DOWNLOAD_FAILED',
  STORAGE_DELETE_FAILED = 'STORAGE_DELETE_FAILED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_BUCKET_NOT_FOUND = 'STORAGE_BUCKET_NOT_FOUND',
  
  // Business Logic
  BUSINESS_INVALID_STATUS = 'BUSINESS_INVALID_STATUS',
  BUSINESS_INSUFFICIENT_BALANCE = 'BUSINESS_INSUFFICIENT_BALANCE',
  BUSINESS_DUPLICATE_REQUEST = 'BUSINESS_DUPLICATE_REQUEST',
  BUSINESS_OPERATION_NOT_ALLOWED = 'BUSINESS_OPERATION_NOT_ALLOWED',
  
  // Network & System
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// ============================================================================
// Custom Error Classes
// ============================================================================

export class AppError extends Error {
  code: ErrorCode
  statusCode: number
  details?: Record<string, any>
  isOperational: boolean

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.isOperational = isOperational

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: Record<string, any>) {
    super(ErrorCode.AUTH_UNAUTHORIZED, message, 401, details)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: Record<string, any>) {
    super(ErrorCode.AUTH_FORBIDDEN, message, 403, details)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: Record<string, any>) {
    super(ErrorCode.DATABASE_NOT_FOUND, `${resource} not found`, 404, details)
    this.name = 'NotFoundError'
  }
}

export class StorageError extends AppError {
  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(code, message, 500, details)
    this.name = 'StorageError'
  }
}

// ============================================================================
// Error Response Formatting
// ============================================================================

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, any>
    timestamp?: string
  }
}

export function formatErrorResponse(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString()

  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
      },
    }
  }

  if (error instanceof Error) {
    return {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error.message,
        timestamp,
      },
    }
  }

  return {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      timestamp,
    },
  }
}

// ============================================================================
// User-Friendly Error Messages
// ============================================================================

const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ErrorCode.AUTH_UNAUTHORIZED]: 'Please log in to continue',
  [ErrorCode.AUTH_FORBIDDEN]: 'You do not have permission to perform this action',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please log in again',
  [ErrorCode.AUTH_INVALID_TOKEN]: 'Invalid authentication token. Please log in again',
  
  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
  [ErrorCode.VALIDATION_FILE_TYPE]: 'This file type is not supported',
  [ErrorCode.VALIDATION_FILE_SIZE]: 'File size exceeds the maximum limit',
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Please fill in all required fields',
  [ErrorCode.VALIDATION_INVALID_DATE]: 'Please select a valid date',
  
  // Database
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again',
  [ErrorCode.DATABASE_NOT_FOUND]: 'The requested item was not found',
  [ErrorCode.DATABASE_CONSTRAINT]: 'This operation violates data constraints',
  [ErrorCode.DATABASE_CONNECTION]: 'Unable to connect to the database',
  
  // Storage
  [ErrorCode.STORAGE_UPLOAD_FAILED]: 'Failed to upload file. Please try again',
  [ErrorCode.STORAGE_DOWNLOAD_FAILED]: 'Failed to download file. Please try again',
  [ErrorCode.STORAGE_DELETE_FAILED]: 'Failed to delete file. Please try again',
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded',
  [ErrorCode.STORAGE_BUCKET_NOT_FOUND]: 'Storage location not found',
  
  // Business Logic
  [ErrorCode.BUSINESS_INVALID_STATUS]: 'This operation is not allowed for the current status',
  [ErrorCode.BUSINESS_INSUFFICIENT_BALANCE]: 'Insufficient leave balance',
  [ErrorCode.BUSINESS_DUPLICATE_REQUEST]: 'A similar request already exists',
  [ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED]: 'This operation is not allowed',
  
  // Network & System
  [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ErrorCode.TIMEOUT_ERROR]: 'Request timed out. Please try again',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again',
  [ErrorCode.METHOD_NOT_ALLOWED]: 'This operation is not supported',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
}

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return USER_FRIENDLY_MESSAGES[error.code] || error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

// ============================================================================
// Error Logging
// ============================================================================

export interface ErrorLogContext {
  userId?: string
  path?: string
  method?: string
  requestId?: string
  [key: string]: unknown
}

export function logError(
  error: unknown,
  context?: ErrorLogContext
): void {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const timestamp = new Date().toISOString()

  const logData = {
    timestamp,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError && {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        isOperational: error.isOperational,
      }),
    } : error,
    context,
  }

  if (isDevelopment) {
    console.error('Error:', logData)
  } else {
    // In production, log to external service (e.g., Sentry, LogRocket)
    console.error(JSON.stringify(logData))
    
    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { custom: context } })
  }
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode
  }
  return 500
}

export function getErrorCode(error: unknown): ErrorCode {
  if (error instanceof AppError) {
    return error.code
  }
  return ErrorCode.INTERNAL_ERROR
}

// ============================================================================
// Retry Logic
// ============================================================================

export interface RetryOptions {
  maxRetries: number
  delayMs: number
  backoff?: 'linear' | 'exponential'
  onRetry?: (attempt: number, error: unknown) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, delayMs, backoff = 'exponential', onRetry } = options
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on operational errors that shouldn't be retried
      if (error instanceof AppError && !shouldRetry(error)) {
        throw error
      }

      if (attempt < maxRetries) {
        const delay = backoff === 'exponential' 
          ? delayMs * Math.pow(2, attempt)
          : delayMs * (attempt + 1)

        onRetry?.(attempt + 1, error)
        await sleep(delay)
      }
    }
  }

  throw lastError
}

function shouldRetry(error: AppError): boolean {
  // Don't retry validation, auth, or not found errors
  const nonRetryableCodes = [
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.VALIDATION_FILE_TYPE,
    ErrorCode.VALIDATION_FILE_SIZE,
    ErrorCode.AUTH_UNAUTHORIZED,
    ErrorCode.AUTH_FORBIDDEN,
    ErrorCode.DATABASE_NOT_FOUND,
    ErrorCode.METHOD_NOT_ALLOWED,
  ]

  return !nonRetryableCodes.includes(error.code)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// Supabase Error Handling
// ============================================================================

export function handleSupabaseError(error: unknown): AppError {
  // Handle specific Supabase error codes
  if (error && typeof error === 'object' && 'code' in error) {
    const errorWithCode = error as { code: string; message?: string }
    
    if (errorWithCode.code === 'PGRST116') {
      return new NotFoundError('Resource')
    }

    if (errorWithCode.code === '23505') {
    return new AppError(
      ErrorCode.DATABASE_CONSTRAINT,
      'A record with this information already exists',
      409
    )
  }

    if (errorWithCode.code === '23503') {
      return new AppError(
        ErrorCode.DATABASE_CONSTRAINT,
        'Referenced record does not exist',
        400
      )
    }

    if (errorWithCode.message?.includes('JWT')) {
      return new AuthenticationError('Invalid or expired session')
    }

    if (errorWithCode.message?.includes('permission')) {
      return new AuthorizationError('Insufficient permissions')
    }

    // Generic database error
    return new AppError(
      ErrorCode.DATABASE_ERROR,
      errorWithCode.message || 'Database operation failed',
      500,
      { originalError: error }
    )
  }

  // Handle non-object errors
  return new AppError(
    ErrorCode.DATABASE_ERROR,
    'Database operation failed',
    500,
    { originalError: error }
  )
}
