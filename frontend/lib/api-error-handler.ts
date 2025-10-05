/**
 * API Error Handler Middleware
 * 
 * Provides standardized error handling for Next.js API routes
 * with proper status codes, logging, and error responses.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ErrorCode,
  formatErrorResponse,
  logError,
  getErrorStatusCode,
  handleSupabaseError,
} from './errors'

// ============================================================================
// API Handler Wrapper
// ============================================================================

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void

/**
 * Wraps an API handler with standardized error handling
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      handleApiError(error, req, res)
    }
  }
}

/**
 * Handle API errors with proper status codes and logging
 */
export function handleApiError(
  error: unknown,
  req: NextApiRequest,
  res: NextApiResponse
): void {
  // Log the error with context
  logError(error, {
    path: req.url,
    method: req.method,
    userId: (req as { user?: { id: string } }).user?.id,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
  })

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const appError = handleSupabaseError(error)
    const statusCode = getErrorStatusCode(appError)
    const errorResponse = formatErrorResponse(appError)
    return res.status(statusCode).json(errorResponse)
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    const statusCode = getErrorStatusCode(error)
    const errorResponse = formatErrorResponse(error)
    return res.status(statusCode).json(errorResponse)
  }

  // Handle generic errors
  const statusCode = getErrorStatusCode(error)
  const errorResponse = formatErrorResponse(error)
  res.status(statusCode).json(errorResponse)
}

// ============================================================================
// Method Validation
// ============================================================================

export function validateMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethods: string[]
): boolean {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.status(405).json(
      formatErrorResponse(
        new AppError(
          ErrorCode.METHOD_NOT_ALLOWED,
          `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
          405
        )
      )
    )
    return false
  }
  return true
}

// ============================================================================
// Authentication Validation
// ============================================================================

export function requireAuth(user: unknown): void {
  if (!user) {
    throw new AuthenticationError('Authentication required')
  }
}

export function requireRole(
  userRole: string | undefined,
  allowedRoles: string[]
): void {
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new AuthorizationError(
      `Access denied. Required roles: ${allowedRoles.join(', ')}`
    )
  }
}

// ============================================================================
// Request Validation
// ============================================================================

export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => !data[field])
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    )
  }
}

export function validateId(id: unknown, resourceName: string = 'Resource'): string {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`${resourceName} ID is required and must be a string`)
  }
  return id
}

// ============================================================================
// Response Helpers
// ============================================================================

export function sendSuccess<T>(
  res: NextApiResponse,
  data: T,
  statusCode: number = 200
): void {
  res.status(statusCode).json({ data })
}

export function sendCreated<T>(res: NextApiResponse, data: T): void {
  res.status(201).json({ data })
}

export function sendNoContent(res: NextApiResponse): void {
  res.status(204).end()
}

export function sendError(
  res: NextApiResponse,
  error: AppError | Error | unknown,
  statusCode?: number
): void {
  const status = statusCode || getErrorStatusCode(error)
  const errorResponse = formatErrorResponse(error)
  res.status(status).json(errorResponse)
}

// ============================================================================
// 404 Handler
// ============================================================================

export function handle404(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  const error = new NotFoundError('API endpoint', {
    path: req.url,
    method: req.method,
  })
  
  logError(error, {
    path: req.url,
    method: req.method,
  })
  
  res.status(404).json(formatErrorResponse(error))
}

// ============================================================================
// Rate Limiting Helper
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

export function requireRateLimit(
  identifier: string,
  maxRequests?: number,
  windowMs?: number
): void {
  if (!checkRateLimit(identifier, maxRequests, windowMs)) {
    throw new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests. Please try again later',
      429
    )
  }
}
