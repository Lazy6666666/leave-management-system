# Composite Components Guide

This document provides usage examples for the composite components created for common UI patterns in the Leave Management System.

## StatCard

A card component for displaying dashboard metrics with optional icons and trend indicators.

### Basic Usage

```tsx
import { StatCard } from '@/components/ui/stat-card'
import { Calendar } from 'lucide-react'

<StatCard 
  title="Total Leaves" 
  value={12} 
/>
```

### With Icon and Description

```tsx
<StatCard
  title="Pending Requests"
  value={5}
  description="Awaiting approval"
  icon={Calendar}
/>
```

### With Trend Information

```tsx
<StatCard
  title="Approved Leaves"
  value={8}
  trend={{ 
    value: 12, 
    label: 'from last month', 
    isPositive: true 
  }}
/>
```

### Props

- `title` (string, required): The metric title
- `value` (string | number, required): The metric value to display
- `description` (string, optional): Additional description text
- `icon` (LucideIcon, optional): Icon component to display
- `trend` (object, optional): Trend information with `value`, `label`, and `isPositive`
- `variant` ('default' | 'elevated' | 'outlined', optional): Card variant style

---

## LeaveCard

A card component for displaying leave request information with status badges and optional action buttons.

### Basic Usage

```tsx
import { LeaveCard } from '@/components/ui/leave-card'

<LeaveCard
  leaveType="Annual Leave"
  startDate="2025-01-15"
  endDate="2025-01-20"
  duration="5 days"
  status="pending"
/>
```

### With Employee Name and Reason

```tsx
<LeaveCard
  employeeName="John Doe"
  leaveType="Sick Leave"
  startDate="2025-01-10"
  endDate="2025-01-12"
  duration="3 days"
  reason="Medical appointment"
  status="approved"
/>
```

### With Action Buttons (Admin View)

```tsx
<LeaveCard
  employeeName="Jane Smith"
  leaveType="Annual Leave"
  startDate="2025-01-15"
  endDate="2025-01-20"
  duration="5 days"
  reason="Family vacation"
  status="pending"
  showActions
  onApprove={() => handleApprove(leaveId)}
  onReject={() => handleReject(leaveId)}
/>
```

### With Cancel Button (Employee View)

```tsx
<LeaveCard
  leaveType="Annual Leave"
  startDate="2025-01-15"
  endDate="2025-01-20"
  duration="5 days"
  status="pending"
  showActions
  onCancel={() => handleCancel(leaveId)}
/>
```

### Props

- `employeeName` (string, optional): Name of the employee (for admin views)
- `leaveType` (string, required): Type of leave (Annual, Sick, etc.)
- `startDate` (string, required): Leave start date
- `endDate` (string, required): Leave end date
- `duration` (string, required): Duration of leave (e.g., "5 days")
- `reason` (string, optional): Reason for leave
- `status` ('pending' | 'approved' | 'rejected' | 'cancelled', required): Leave status
- `onApprove` (function, optional): Callback for approve action
- `onReject` (function, optional): Callback for reject action
- `onCancel` (function, optional): Callback for cancel action
- `showActions` (boolean, optional): Whether to show action buttons
- `variant` ('default' | 'elevated' | 'outlined', optional): Card variant style

---

## PageHeader

A header component for pages with title, description, and action buttons.

### Basic Usage

```tsx
import { PageHeader } from '@/components/ui/page-header'

<PageHeader title="Dashboard" />
```

### With Description

```tsx
<PageHeader
  title="Leave Requests"
  description="Manage all employee leave requests"
/>
```

### With Action Buttons

```tsx
import { Button } from '@/ui/button'
import { Plus } from 'lucide-react'

<PageHeader
  title="Leave Requests"
  description="View and manage your leave requests"
  actions={
    <>
      <Button variant="outline">Export</Button>
      <Button>
        <Plus className="h-4 w-4" />
        New Request
      </Button>
    </>
  }
/>
```

### Props

- `title` (string, required): Page title
- `description` (string, optional): Page description
- `actions` (ReactNode, optional): Action buttons or other elements

---

## EmptyState

A component for displaying empty states with icons, messages, and call-to-action buttons.

### Basic Usage

```tsx
import { EmptyState } from '@/components/ui/empty-state'

<EmptyState title="No leaves found" />
```

### With Icon and Description

```tsx
import { Calendar } from 'lucide-react'

<EmptyState
  icon={Calendar}
  title="No leaves found"
  description="You haven't submitted any leave requests yet"
/>
```

### With Action Button

```tsx
import { Plus } from 'lucide-react'

<EmptyState
  icon={Plus}
  title="No leaves found"
  description="Get started by creating your first leave request"
  action={{
    label: 'Create Leave Request',
    onClick: () => router.push('/dashboard/leaves/new')
  }}
/>
```

### With Primary and Secondary Actions

```tsx
import { FileText } from 'lucide-react'

<EmptyState
  icon={FileText}
  title="No pending requests"
  description="All leave requests have been processed"
  action={{
    label: 'View All Leaves',
    onClick: () => router.push('/dashboard/leaves')
  }}
  secondaryAction={{
    label: 'Create New Request',
    onClick: () => router.push('/dashboard/leaves/new')
  }}
/>
```

### Props

- `icon` (LucideIcon, optional): Icon component to display
- `title` (string, required): Empty state title
- `description` (string, optional): Empty state description
- `action` (object, optional): Primary action with `label` and `onClick`
- `secondaryAction` (object, optional): Secondary action with `label` and `onClick`

---

## Design Principles

All composite components follow these design principles:

1. **Consistent Spacing**: Use the 8-point spacing system (4px, 8px, 12px, 16px, 24px, 32px)
2. **Semantic Colors**: Use semantic color tokens (success, warning, destructive, info)
3. **Accessibility**: Include proper ARIA labels and keyboard navigation support
4. **Responsive Design**: Adapt layout for mobile, tablet, and desktop viewports
5. **Dark Mode Support**: All components work in both light and dark themes
6. **Type Safety**: Full TypeScript support with exported prop types

## Requirements Mapping

These components satisfy the following requirements from the UI/UX Enhancement spec:

- **Requirement 5.1**: Dashboard metrics in well-designed card components (StatCard)
- **Requirement 5.3**: Visual elements following the design system (StatCard trends)
- **Requirement 8.1**: Consistent type scale for headings and body text (PageHeader)
- **Requirement 8.2**: Appropriate font weights and sizes (All components)

## Usage in Pages

### Dashboard Example

```tsx
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/ui/button'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your leave requests and balances"
        actions={
          <Button>
            <Calendar className="h-4 w-4" />
            New Request
          </Button>
        }
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leaves"
          value={20}
          description="Annual allocation"
          icon={Calendar}
        />
        <StatCard
          title="Used"
          value={8}
          description="Days taken"
          icon={CheckCircle}
        />
        <StatCard
          title="Pending"
          value={2}
          description="Awaiting approval"
          icon={Clock}
        />
        <StatCard
          title="Remaining"
          value={12}
          description="Available days"
          icon={Calendar}
        />
      </div>
    </div>
  )
}
```

### Leave List Example

```tsx
import { LeaveCard } from '@/components/ui/leave-card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Calendar } from 'lucide-react'

export default function LeaveList({ leaves }) {
  if (leaves.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Leaves" />
        <EmptyState
          icon={Calendar}
          title="No leave requests"
          description="You haven't submitted any leave requests yet"
          action={{
            label: 'Create Leave Request',
            onClick: () => router.push('/dashboard/leaves/new')
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leaves"
        description="View and manage your leave requests"
      />
      
      <div className="grid gap-4 md:grid-cols-2">
        {leaves.map((leave) => (
          <LeaveCard
            key={leave.id}
            leaveType={leave.type}
            startDate={leave.startDate}
            endDate={leave.endDate}
            duration={leave.duration}
            reason={leave.reason}
            status={leave.status}
            showActions
            onCancel={() => handleCancel(leave.id)}
          />
        ))}
      </div>
    </div>
  )
}
```
