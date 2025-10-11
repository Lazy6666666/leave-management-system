import type { LeaveStatus } from '@/types'

/**
 * Maps leave status to appropriate badge variant with semantic colors
 * @param status - The leave request status
 * @returns Badge variant that represents the status semantically
 */
export function getStatusBadgeVariant(
  status: LeaveStatus
): 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (status) {
    case 'approved':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'destructive'
    case 'cancelled':
      return 'secondary'
    default:
      return 'secondary'
  }
}

/**
 * Gets a human-readable label for a leave status
 * @param status - The leave request status
 * @returns Formatted status label
 */
export function getStatusLabel(status: LeaveStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function getRoleBadgeVariant(
  role: 'employee' | 'manager' | 'admin' | 'hr'
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (role) {
    case 'admin':
      return 'destructive'
    case 'manager':
      return 'secondary'
    case 'hr':
      return 'outline'
    case 'employee':
      return 'default'
    default:
      return 'default'
  }
}

/**
 * Normalizes a role string to ensure it matches the expected type
 * @param role - The role string to normalize
 * @returns A properly typed role
 */
export function normalizeRole(
  role: string | undefined | null
): 'employee' | 'manager' | 'admin' | 'hr' {
  if (!role) {
    return 'employee'
  }

  const normalized = role.toLowerCase() as 'employee' | 'manager' | 'admin' | 'hr'
  const validRoles: readonly ('employee' | 'manager' | 'admin' | 'hr')[] = [
    'employee',
    'manager',
    'admin',
    'hr'
  ]

  return validRoles.includes(normalized) ? normalized : 'employee'
}


/**
 * Configuration object for status display
 */
export const statusConfig: Record<
  LeaveStatus,
  {
    label: string
    variant: 'success' | 'warning' | 'destructive' | 'secondary'
    description: string
  }
> = {
  pending: {
    label: 'Pending',
    variant: 'warning',
    description: 'Awaiting approval',
  },
  approved: {
    label: 'Approved',
    variant: 'success',
    description: 'Request has been approved',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    description: 'Request has been rejected',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'secondary',
    description: 'Request has been cancelled',
  },
}
