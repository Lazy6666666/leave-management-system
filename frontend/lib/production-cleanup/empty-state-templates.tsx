import React from 'react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/ui/empty'
import { Calendar, Users, Bell, FileX, AlertCircle, Wifi, Shield } from 'lucide-react'
import { Button } from '@/ui/button'

// Common empty state templates for the Leave Management System

interface EmptyStateProps {
  className?: string
  onAction?: () => void
}

/**
 * Empty state for leave requests list
 */
export function NoLeaveRequestsEmpty({ className, onAction }: EmptyStateProps) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Calendar />
        </EmptyMedia>
        <EmptyTitle>No Leave Requests Yet</EmptyTitle>
        <EmptyDescription>
          You haven't submitted any leave requests yet. Get started by creating your first request.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onAction}>Create Leave Request</Button>
      </EmptyContent>
    </Empty>
  )
}

/**
 * Empty state for team members list
 */
export function NoTeamMembersEmpty({ className, onAction }: EmptyStateProps) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>No Team Members</EmptyTitle>
        <EmptyDescription>
          No team members have been added yet. Invite team members to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onAction}>Invite Team Member</Button>
      </EmptyContent>
    </Empty>
  )
}

/**
 * Empty state for notifications
 */
export function NoNotificationsEmpty({ className }: Omit<EmptyStateProps, 'onAction'>) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Bell />
        </EmptyMedia>
        <EmptyTitle>No Notifications</EmptyTitle>
        <EmptyDescription>
          You're all caught up! No new notifications at this time.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/**
 * Empty state for general no data scenarios
 */
export function NoDataEmpty({ className }: Omit<EmptyStateProps, 'onAction'>) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileX />
        </EmptyMedia>
        <EmptyTitle>No Data Available</EmptyTitle>
        <EmptyDescription>
          No data is available at this time. Please check back later.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/**
 * Empty state for access denied scenarios
 */
export function AccessDeniedEmpty({ className }: Omit<EmptyStateProps, 'onAction'>) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Shield />
        </EmptyMedia>
        <EmptyTitle>Access Denied</EmptyTitle>
        <EmptyDescription>
          You don't have permission to view this content. Contact your administrator if you believe this is an error.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/**
 * Empty state for network errors
 */
export function NetworkErrorEmpty({ className, onAction }: EmptyStateProps) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Wifi />
        </EmptyMedia>
        <EmptyTitle>Connection Error</EmptyTitle>
        <EmptyDescription>
          Unable to connect to the server. Please check your internet connection and try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onAction} variant="outline">Try Again</Button>
      </EmptyContent>
    </Empty>
  )
}

/**
 * Empty state for general errors
 */
export function ErrorEmpty({ className, onAction }: EmptyStateProps) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertCircle />
        </EmptyMedia>
        <EmptyTitle>Something Went Wrong</EmptyTitle>
        <EmptyDescription>
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button onClick={onAction} variant="outline">Try Again</Button>
          <Button variant="link">Contact Support</Button>
        </div>
      </EmptyContent>
    </Empty>
  )
}

// Export all templates for easy importing
export const EmptyStateTemplates = {
  NoLeaveRequestsEmpty,
  NoTeamMembersEmpty,
  NoNotificationsEmpty,
  NoDataEmpty,
  AccessDeniedEmpty,
  NetworkErrorEmpty,
  ErrorEmpty,
}

// Type definitions for template props
export type {
  EmptyStateProps,
}