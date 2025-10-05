import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Calendar } from 'lucide-react'
import { StatCard } from '../components/ui/stat-card'
import { LeaveCard } from '../components/ui/leave-card'
import { PageHeader } from '../components/ui/page-header'
import { EmptyState } from '../components/ui/empty-state'

describe('StatCard', () => {
  it('renders with basic props', () => {
    render(<StatCard title="Total Leaves" value={12} />)
    expect(screen.getByText('Total Leaves')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders with icon and description', () => {
    render(
      <StatCard
        title="Pending Requests"
        value={5}
        description="Awaiting approval"
        icon={Calendar}
      />
    )
    expect(screen.getByText('Pending Requests')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Awaiting approval')).toBeInTheDocument()
  })

  it('renders with trend information', () => {
    render(
      <StatCard
        title="Approved Leaves"
        value={8}
        trend={{ value: 12, label: 'from last month', isPositive: true }}
      />
    )
    expect(screen.getByText('+12%')).toBeInTheDocument()
    expect(screen.getByText('from last month')).toBeInTheDocument()
  })
})

describe('LeaveCard', () => {
  it('renders with required props', () => {
    render(
      <LeaveCard
        leaveType="Annual Leave"
        startDate="2025-01-15"
        endDate="2025-01-20"
        duration="5 days"
        status="pending"
      />
    )
    expect(screen.getByText('Annual Leave')).toBeInTheDocument()
    expect(screen.getByText('2025-01-15 - 2025-01-20')).toBeInTheDocument()
    expect(screen.getByText('5 days')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders with employee name and reason', () => {
    render(
      <LeaveCard
        employeeName="John Doe"
        leaveType="Sick Leave"
        startDate="2025-01-10"
        endDate="2025-01-12"
        duration="3 days"
        reason="Medical appointment"
        status="approved"
      />
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Medical appointment')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('renders action buttons when showActions is true', () => {
    const onApprove = vi.fn()
    const onReject = vi.fn()
    
    render(
      <LeaveCard
        leaveType="Annual Leave"
        startDate="2025-01-15"
        endDate="2025-01-20"
        duration="5 days"
        status="pending"
        showActions
        onApprove={onApprove}
        onReject={onReject}
      />
    )
    
    expect(screen.getByLabelText('Approve leave request')).toBeInTheDocument()
    expect(screen.getByLabelText('Reject leave request')).toBeInTheDocument()
  })

  it('calls onApprove when approve button is clicked', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    
    render(
      <LeaveCard
        leaveType="Annual Leave"
        startDate="2025-01-15"
        endDate="2025-01-20"
        duration="5 days"
        status="pending"
        showActions
        onApprove={onApprove}
        onReject={vi.fn()}
      />
    )
    
    await user.click(screen.getByLabelText('Approve leave request'))
    expect(onApprove).toHaveBeenCalledTimes(1)
  })
})

describe('PageHeader', () => {
  it('renders with title only', () => {
    render(<PageHeader title="Dashboard" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders with title and description', () => {
    render(
      <PageHeader
        title="Leave Requests"
        description="Manage all employee leave requests"
      />
    )
    expect(screen.getByText('Leave Requests')).toBeInTheDocument()
    expect(screen.getByText('Manage all employee leave requests')).toBeInTheDocument()
  })

  it('renders with action buttons', () => {
    render(
      <PageHeader
        title="Dashboard"
        actions={<button>New Request</button>}
      />
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('New Request')).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders with title only', () => {
    render(<EmptyState title="No leaves found" />)
    expect(screen.getByText('No leaves found')).toBeInTheDocument()
  })

  it('renders with icon, title, and description', () => {
    render(
      <EmptyState
        icon={Calendar}
        title="No leaves found"
        description="You haven't submitted any leave requests yet"
      />
    )
    expect(screen.getByText('No leaves found')).toBeInTheDocument()
    expect(screen.getByText("You haven't submitted any leave requests yet")).toBeInTheDocument()
  })

  it('renders with action button', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="No leaves found"
        action={{ label: 'Create Leave Request', onClick }}
      />
    )
    expect(screen.getByLabelText('Create Leave Request')).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    
    render(
      <EmptyState
        title="No leaves found"
        action={{ label: 'Create Leave Request', onClick }}
      />
    )
    
    await user.click(screen.getByLabelText('Create Leave Request'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders with primary and secondary actions', () => {
    render(
      <EmptyState
        title="No leaves found"
        action={{ label: 'Create Request', onClick: vi.fn() }}
        secondaryAction={{ label: 'View History', onClick: vi.fn() }}
      />
    )
    expect(screen.getByLabelText('Create Request')).toBeInTheDocument()
    expect(screen.getByLabelText('View History')).toBeInTheDocument()
  })
})
