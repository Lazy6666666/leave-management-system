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
