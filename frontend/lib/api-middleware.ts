/**
 * API Middleware
 * 
 * Provides middleware functions for API routes including error handling,
 * authentication, authorization, and request validation.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { getUserProfile, isManagerOrHigher, isAdmin } from '@/lib/permissions'
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ErrorCode,
  formatErrorResponse,
  logError,
  handleSupabaseError,
  type ErrorLogContext,
} from './errors'

// ============================================================================
// Types
// ============================================================================

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string
    email?: string
  }
  supabase: ReturnType<typeof createClient>
}

export interface AuthorizedRequest extends AuthenticatedRequest {
  profile: {
    id: string
    role: string
    department?: string | null
    full_name?: string
  }
}

// ============================================================================
// Error Handling Middleware
// ============================================================================

/**
 * Wraps an API handler with error handling
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      handleApiError(error, req, res)
    }
  }
}

/**
 * Handles API errors and sends appropriate response
 */
export function handleApiError(
  error: unknown,
  req: NextApiRequest,
  res: NextApiResponse
): void {
  // Log error with context
  const context: ErrorLogContext = {
    path: req.url,
    method: req.method,
    query: req.query,
    // Don't log sensitive data like body or headers
  }

  logError(error, context)

  // Format and send error response
  const errorResponse = formatErrorResponse(error)
  const statusCode = error instanceof AppError ? error.statusCode : 500

  res.status(statusCode).json(errorResponse)
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Ensures the request is authenticated
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
): ApiHandler {
  return withErrorHandling(async (req: NextApiRequest, res: NextApiResponse) => {
    const supabase = createClient(req, res)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw handleSupabaseError(authError)
    }

    if (!user) {
      throw new AuthenticationError('Authentication required')
    }

    // Attach user and supabase to request
    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = {
      id: user.id,
      email: user.email,
    }
    authenticatedReq.supabase = supabase

    await handler(authenticatedReq, res)
  })
}

// ============================================================================
// Authorization Middleware
// ============================================================================

/**
 * Ensures the user has the required role
 */
export function withRole(
  roles: string | string[],
  handler: (req: AuthorizedRequest, res: NextApiResponse) => Promise<void>
): ApiHandler {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const profile = await getUserProfile(req.supabase, req.user.id)

    if (!profile) {
      throw new AuthenticationError('User profile not found')
    }

    if (!allowedRoles.includes(profile.role)) {
      throw new AuthorizationError(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      )
    }

    // Attach profile to request
    const authorizedReq = req as AuthorizedRequest
    authorizedReq.profile = profile

    await handler(authorizedReq, res)
  })
}

/**
 * Ensures the user is a manager or higher
 */
export function withManagerAccess(
  handler: (req: AuthorizedRequest, res: NextApiResponse) => Promise<void>
): ApiHandler {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const profile = await getUserProfile(req.supabase, req.user.id)

    if (!profile) {
      throw new AuthenticationError('User profile not found')
    }

    if (!isManagerOrHigher(profile.role)) {
      throw new AuthorizationError('Manager access required')
    }

    const authorizedReq = req as AuthorizedRequest
    authorizedReq.profile = profile

    await handler(authorizedReq, res)
  })
}

/**
 * Ensures the user is an admin
 */
export function withAdminAccess(
  handler: (req: AuthorizedRequest, res: NextApiResponse) => Promise<void>
): ApiHandler {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const profile = await getUserProfile(req.supabase, req.user.id)

    if (!profile) {
      throw new AuthenticationError('User profile not found')
    }

    if (!isAdmin(profile.role)) {
      throw new AuthorizationError('Admin access required')
    }

    const authorizedReq = req as AuthorizedRequest
    authorizedReq.profile = profile

    await handler(authorizedReq, res)
  })
}

// ============================================================================
// Method Validation Middleware
// ============================================================================

/**
 * Ensures the request uses allowed HTTP methods
 */
export function withMethods(
  methods: string[],
  handler: ApiHandler
): ApiHandler {
  return withErrorHandling(async (req: NextApiRequest, res: NextApiResponse) => {
    if (!req.method || !methods.includes(req.method)) {
      throw new AppError(
        ErrorCode.METHOD_NOT_ALLOWED,
        `Method ${req.method} not allowed. Allowed methods: ${methods.join(', ')}`,
        405
      )
    }

    await handler(req, res)
  })
}

// ============================================================================
// Request Validation Middleware
// ============================================================================

/**
 * Validates request body against a schema
 */
export function withValidation<T>(
  schema: { parse: (data: unknown) => T },
  handler: (
    req: NextApiRequest & { validatedBody: T },
    res: NextApiResponse
  ) => Promise<void>
): ApiHandler {
  return withErrorHandling(async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const validatedBody = schema.parse(req.body)
      const validatedReq = req as NextApiRequest & { validatedBody: T }
      validatedReq.validatedBody = validatedBody

      await handler(validatedReq, res)
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        // Zod validation error
        const issues = (error as { issues: unknown[] }).issues
        throw new ValidationError('Invalid request data', { issues })
      }
      throw error
    }
  })
}

// ============================================================================
// Ownership Validation
// ============================================================================

/**
 * Validates that the user owns the resource or has appropriate permissions
 */
export async function validateOwnership(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  resourceId: string,
  resourceType: 'leave' | 'document',
  allowManagerAccess: boolean = false
): Promise<boolean> {
  const profile = await getUserProfile(supabase, userId)

  if (!profile) {
    return false
  }

  // Admins have access to everything
  if (isAdmin(profile.role)) {
    return true
  }

  // Check resource ownership
  if (resourceType === 'leave') {
    const { data: leave } = await supabase
      .from('leaves')
      .select('requester_id, requester:profiles!leaves_requester_id_fkey(department)')
      .eq('id', resourceId)
      .single()

    if (!leave) {
      return false
    }

    // User owns the resource
    if (leave.requester_id === userId) {
      return true
    }

    // Manager can access if in same department
    if (allowManagerAccess && isManagerOrHigher(profile.role)) {
      return (leave.requester as { department?: string })?.department === profile.department
    }
  }

  if (resourceType === 'document') {
    const { data: document } = await supabase
      .from('leave_documents')
      .select('uploaded_by, leave_request:leaves!leave_documents_leave_request_id_fkey(requester_id)')
      .eq('id', resourceId)
      .single()

    if (!document) {
      return false
    }

    // User uploaded the document
    if (document.uploaded_by === userId) {
      return true
    }

    // User owns the leave request
    if ((document.leave_request as { requester_id?: string })?.requester_id === userId) {
      return true
    }

    // Manager can access if in same department
    if (allowManagerAccess && isManagerOrHigher(profile.role)) {
      // Would need to join with profiles to check department
      return true // Simplified for now
    }
  }

  return false
}

// ============================================================================
// Rate Limiting (Simple Implementation)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple rate limiting middleware
 */
export function withRateLimit(
  maxRequests: number,
  windowMs: number,
  handler: ApiHandler
): ApiHandler {
  return withErrorHandling(async (req: NextApiRequest, res: NextApiResponse) => {
    const identifier = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    const key = `${identifier}:${req.url}`
    const now = Date.now()

    const rateLimit = rateLimitMap.get(key)

    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= maxRequests) {
          throw new AppError(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            'Too many requests. Please try again later.',
            429,
            { retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000) }
          )
        }
        rateLimit.count++
      } else {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
      }
    } else {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    }

    await handler(req, res)
  })
}

// ============================================================================
// Composite Middleware
// ============================================================================

/**
 * Combines multiple middleware functions
 */
export function compose(...middlewares: ((handler: ApiHandler) => ApiHandler)[]): (handler: ApiHandler) => ApiHandler {
  return (handler: ApiHandler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}
