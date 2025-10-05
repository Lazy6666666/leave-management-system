/**
 * API Validation Utilities
 * 
 * Provides validation helpers for API routes with comprehensive
 * error handling and user-friendly error messages.
 */

import { z, ZodError } from 'zod'
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  AppError,
  ErrorCode,
} from './errors'

// ============================================================================
// Validation Schemas
// ============================================================================

export const leaveRequestUpdateSchema = z.object({
  leave_type_id: z.string().uuid('Invalid leave type ID'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must not exceed 500 characters'),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  }
)

export const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().min(10).max(500).optional(),
}).refine(
  (data) => {
    if (data.action === 'reject') {
      return !!data.rejection_reason
    }
    return true
  },
  {
    message: 'Rejection reason is required when rejecting',
    path: ['rejection_reason'],
  }
)

export const documentMetadataSchema = z.object({
  leave_request_id: z.string().uuid(),
  file_name: z.string().min(1).max(255),
  file_size: z.number().int().positive().max(5242880), // 5MB
  file_type: z.string().regex(/^(application\/pdf|image\/(jpeg|png)|application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/),
  storage_path: z.string().min(1),
})

export const leaveTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  default_allocation: z.number().int().positive().max(365),
  is_active: z.boolean().optional().default(true),
})

export const reportFiltersSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  department: z.string().optional(),
  leave_type_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  }
)

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {}
      
      error.issues.forEach((err) => {
        const path = err.path.join('.')
        fieldErrors[path] = err.message
      })
      
      throw new ValidationError(
        'Validation failed',
        { fields: fieldErrors }
      )
    }
    
    throw new ValidationError('Invalid request body')
  }
}

/**
 * Validate UUID parameter
 */
export function validateUuidParam(
  value: unknown,
  paramName: string = 'id'
): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${paramName} must be a string`)
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`Invalid ${paramName} format`)
  }
  
  return value
}

/**
 * Validate date string
 */
export function validateDateString(
  value: unknown,
  fieldName: string = 'date'
): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`)
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  
  if (!dateRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be in YYYY-MM-DD format`)
  }
  
  const date = new Date(value)
  
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} is not a valid date`)
  }
  
  return value
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): void {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (end < start) {
    throw new ValidationError('End date must be on or after start date')
  }
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string = 'value'
): T {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`)
  }
  
  if (!allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    )
  }
  
  return value as T
}

// ============================================================================
// Business Logic Validation
// ============================================================================

/**
 * Validate leave request can be edited
 */
export function validateLeaveRequestEditable(
  status: string,
  userId: string,
  requestUserId: string
): void {
  // Only pending requests can be edited
  if (status !== 'pending') {
    throw new AppError(
      ErrorCode.BUSINESS_INVALID_STATUS,
      'Only pending leave requests can be edited',
      400,
      { currentStatus: status }
    )
  }
  
  // Only the request owner can edit
  if (userId !== requestUserId) {
    throw new AuthorizationError(
      'You can only edit your own leave requests'
    )
  }
}

/**
 * Validate leave request can be approved/rejected
 */
export function validateLeaveRequestApprovable(
  status: string,
  userRole: string
): void {
  // Only pending requests can be approved/rejected
  if (status !== 'pending') {
    throw new AppError(
      ErrorCode.BUSINESS_INVALID_STATUS,
      'Only pending leave requests can be approved or rejected',
      400,
      { currentStatus: status }
    )
  }
  
  // Only managers and admins can approve
  if (!['manager', 'admin'].includes(userRole)) {
    throw new AuthorizationError(
      'Only managers and admins can approve leave requests'
    )
  }
}

/**
 * Validate leave type can be deleted
 */
export function validateLeaveTypeDeletable(
  leaveTypeId: string,
  usageCount: number
): void {
  if (usageCount > 0) {
    throw new AppError(
      ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED,
      'Cannot delete leave type that is in use',
      400,
      {
        leaveTypeId,
        usageCount,
        suggestion: 'Consider deactivating the leave type instead',
      }
    )
  }
}

/**
 * Validate sufficient leave balance
 */
export function validateLeaveBalance(
  requestedDays: number,
  availableBalance: number,
  leaveTypeName: string
): void {
  if (requestedDays > availableBalance) {
    throw new AppError(
      ErrorCode.BUSINESS_INSUFFICIENT_BALANCE,
      `Insufficient ${leaveTypeName} balance`,
      400,
      {
        requested: requestedDays,
        available: availableBalance,
        shortfall: requestedDays - availableBalance,
      }
    )
  }
}

/**
 * Validate no overlapping leave requests
 */
export function validateNoOverlap(
  startDate: string,
  endDate: string,
  existingRequests: Array<{ start_date: string; end_date: string; id: string }>
): void {
  const newStart = new Date(startDate)
  const newEnd = new Date(endDate)
  
  for (const existing of existingRequests) {
    const existingStart = new Date(existing.start_date)
    const existingEnd = new Date(existing.end_date)
    
    // Check for overlap
    if (newStart <= existingEnd && newEnd >= existingStart) {
      throw new AppError(
        ErrorCode.BUSINESS_DUPLICATE_REQUEST,
        'Leave request overlaps with an existing request',
        400,
        {
          existingRequestId: existing.id,
          existingDates: {
            start: existing.start_date,
            end: existing.end_date,
          },
        }
      )
    }
  }
}

// ============================================================================
// Authorization Validation
// ============================================================================

/**
 * Validate user has required role
 */
export function validateUserRole(
  userRole: string | undefined,
  requiredRoles: string[]
): void {
  if (!userRole || !requiredRoles.includes(userRole)) {
    throw new AuthorizationError(
      `Access denied. Required roles: ${requiredRoles.join(', ')}`
    )
  }
}

/**
 * Validate user owns resource
 */
export function validateResourceOwnership(
  userId: string,
  resourceUserId: string,
  resourceName: string = 'resource'
): void {
  if (userId !== resourceUserId) {
    throw new AuthorizationError(
      `You do not have permission to access this ${resourceName}`
    )
  }
}

/**
 * Validate manager can access team member's data
 */
export function validateManagerAccess(
  userRole: string,
  managerId: string | null,
  requestedUserId: string,
  currentUserId: string
): void {
  // Admins can access everything
  if (userRole === 'admin') {
    return
  }
  
  // Managers can access their team members' data
  if (userRole === 'manager') {
    // Check if the requested user is in the manager's team
    if (managerId === currentUserId) {
      return
    }
  }
  
  // Users can access their own data
  if (requestedUserId === currentUserId) {
    return
  }
  
  throw new AuthorizationError(
    'You do not have permission to access this data'
  )
}

// ============================================================================
// Resource Existence Validation
// ============================================================================

/**
 * Validate resource exists
 */
export function validateResourceExists<T>(
  resource: T | null | undefined,
  resourceName: string = 'Resource'
): T {
  if (!resource) {
    throw new NotFoundError(resourceName)
  }
  
  return resource
}

/**
 * Validate multiple resources exist
 */
export function validateResourcesExist<T>(
  resources: T[],
  expectedCount: number,
  resourceName: string = 'Resource'
): T[] {
  if (resources.length !== expectedCount) {
    throw new NotFoundError(
      `${resourceName} (expected ${expectedCount}, found ${resources.length})`
    )
  }
  
  return resources
}

// ============================================================================
// File Validation
// ============================================================================

/**
 * Validate file metadata
 */
export function validateFileMetadata(
  fileName: string,
  fileSize: number,
  fileType: string
): void {
  // Validate file name
  if (!fileName || fileName.length === 0) {
    throw new ValidationError('File name is required')
  }
  
  if (fileName.length > 255) {
    throw new ValidationError('File name is too long (max 255 characters)')
  }
  
  // Validate file size
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  
  if (fileSize <= 0) {
    throw new ValidationError('File size must be greater than 0')
  }
  
  if (fileSize > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    )
  }
  
  // Validate file type
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  
  if (!ALLOWED_TYPES.includes(fileType)) {
    throw new ValidationError(
      'Invalid file type. Allowed types: PDF, JPEG, PNG, DOC, DOCX'
    )
  }
}

// ============================================================================
// Pagination Validation
// ============================================================================

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

/**
 * Validate and parse pagination parameters
 */
export function validatePagination(
  page: unknown,
  limit: unknown,
  maxLimit: number = 100
): PaginationParams {
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : 1
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : 10
  
  if (isNaN(parsedPage) || parsedPage < 1) {
    throw new ValidationError('Page must be a positive integer')
  }
  
  if (isNaN(parsedLimit) || parsedLimit < 1) {
    throw new ValidationError('Limit must be a positive integer')
  }
  
  if (parsedLimit > maxLimit) {
    throw new ValidationError(`Limit cannot exceed ${maxLimit}`)
  }
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit,
  }
}
