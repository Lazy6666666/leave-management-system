# Empty States System

This directory contains the comprehensive empty state system for the Leave Management System, built with shadcn/ui components and TypeScript.

## Overview

The empty state system provides:
- **Reusable Templates**: Pre-built empty state components for common scenarios
- **Type-Safe Configuration**: TypeScript interfaces and Zod validation
- **React Query Integration**: Seamless integration with data fetching patterns
- **Accessibility Compliant**: ARIA labels, keyboard navigation, and semantic HTML
- **Consistent Design**: Following shadcn/ui design system principles

## Architecture

```
empty-states/
├── README.md                    # This documentation
├── templates/                   # Pre-built empty state components
│   ├── NoLeaveRequestsEmpty.tsx
│   ├── NoTeamMembersEmpty.tsx
│   ├── NoNotificationsEmpty.tsx
│   └── ...
├── config/                      # Configuration and types
│   ├── empty-state-config.ts    # Configuration system
│   └── predefined-configs.ts    # Pre-defined configurations
└── utils/                       # Integration utilities
    ├── integration.ts           # Component integration helpers
    └── generators.ts            # Code generation utilities
```

## Quick Start

### 1. Using Pre-built Templates

```tsx
import { NoLeaveRequestsEmpty } from '@/lib/production-cleanup/empty-state-templates'

function LeaveRequestsList({ leaveRequests }) {
  if (leaveRequests.length === 0) {
    return <NoLeaveRequestsEmpty onAction={() => createNewRequest()} />
  }
  
  return (
    <div>
      {leaveRequests.map(request => (
        <LeaveRequestCard key={request.id} request={request} />
      ))}
    </div>
  )
}
```

### 2. With React Query Integration

```tsx
import { NoLeaveRequestsEmpty, ErrorEmpty } from '@/lib/production-cleanup/empty-state-templates'
import { Skeleton } from '@/ui/skeleton'

function LeaveRequestsList() {
  const { data: leaveRequests, isLoading, error } = useLeaveRequests()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorEmpty onAction={() => window.location.reload()} />
  }

  if (!leaveRequests || leaveRequests.length === 0) {
    return <NoLeaveRequestsEmpty onAction={() => createNewRequest()} />
  }

  return (
    <div>
      {leaveRequests.map(request => (
        <LeaveRequestCard key={request.id} request={request} />
      ))}
    </div>
  )
}
```

### 3. Custom Empty State Configuration

```tsx
import { EmptyStateConfigBuilder } from '@/lib/production-cleanup/empty-state-config'

const customConfig = EmptyStateConfigBuilder
  .create('custom-empty', 'CustomComponent')
  .withHeader(
    'No Custom Data',
    'Your custom data will appear here when available.',
    { variant: 'icon', icon: 'Database' }
  )
  .withActions([
    { label: 'Add Data', variant: 'default' },
    { label: 'Import', variant: 'outline' }
  ])
  .withLearnMore('Learn more about custom data', '/help/custom-data')
  .build()
```

## Available Templates

### Data Empty States
- `NoLeaveRequestsEmpty` - For empty leave requests lists
- `NoTeamMembersEmpty` - For empty team member lists  
- `NoNotificationsEmpty` - For empty notification lists
- `NoDocumentsEmpty` - For empty document lists
- `NoDataEmpty` - Generic empty data state

### Error States
- `ErrorEmpty` - General error state with retry option
- `NetworkErrorEmpty` - Network connectivity errors
- `AccessDeniedEmpty` - Permission denied scenarios

## Configuration System

### EmptyStateConfig Interface

```typescript
interface EmptyStateConfig {
  id: string
  component: string
  header: {
    media: {
      variant: 'default' | 'icon'
      icon?: string
      customElement?: React.ReactNode
    }
    title: string
    description: string
  }
  content?: {
    actions: Array<{
      label: string
      variant: 'default' | 'outline' | 'link'
      size?: 'sm' | 'default' | 'lg'
      href?: string
      onClick?: () => void
    }>
  }
  learnMore?: {
    text: string
    href: string
    external?: boolean
  }
  className?: string
}
```

### Predefined Configurations

The system includes predefined configurations for common scenarios:

- `noLeaveRequests` - Leave requests empty state
- `noTeamMembers` - Team members empty state
- `noNotifications` - Notifications empty state
- `noDocuments` - Documents empty state
- `accessDenied` - Access denied state
- `networkError` - Network error state
- `generalError` - General error state

## Integration Patterns

### React Query Pattern

```tsx
function DataComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData
  })

  // Loading state
  if (isLoading) return <LoadingSkeleton />
  
  // Error state
  if (error) return <ErrorEmpty onAction={refetch} />
  
  // Empty state
  if (!data || data.length === 0) return <EmptyStateComponent />
  
  // Data state
  return <DataList data={data} />
}
```

### Conditional Rendering Pattern

```tsx
function ListComponent({ items, isLoading, error }) {
  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorEmpty />
  if (items.length === 0) return <EmptyStateComponent />
  return <ItemsList items={items} />
}
```

## Accessibility Features

All empty state components include:

- **Semantic HTML**: Proper heading hierarchy and structure
- **ARIA Labels**: Screen reader friendly descriptions
- **Keyboard Navigation**: Tab-accessible action buttons
- **High Contrast**: Meets WCAG color contrast requirements
- **Focus Management**: Proper focus indicators

## Customization

### Styling

Empty states use Tailwind CSS classes and can be customized:

```tsx
<NoLeaveRequestsEmpty 
  className="my-8 p-6 border-2 border-dashed border-gray-300" 
/>
```

### Actions

Action buttons can be customized with different variants and handlers:

```tsx
<NoLeaveRequestsEmpty 
  onAction={() => {
    // Custom action logic
    router.push('/leave-requests/new')
  }} 
/>
```

### Icons

Icons can be customized using Lucide React icons:

```tsx
const customConfig = {
  header: {
    media: { variant: 'icon', icon: 'Calendar' },
    title: 'Custom Title',
    description: 'Custom description'
  }
}
```

## Best Practices

### 1. Use Appropriate Empty States
- Choose the right template for your use case
- Provide helpful actions when possible
- Include clear, actionable descriptions

### 2. Consistent Patterns
- Follow the same loading → error → empty → data pattern
- Use consistent styling across components
- Maintain the same interaction patterns

### 3. Performance
- Use React.memo for empty state components when needed
- Implement proper loading states to prevent layout shifts
- Consider skeleton loaders for better perceived performance

### 4. Testing
- Test empty state rendering conditions
- Verify action button functionality
- Check accessibility with screen readers

## Migration Guide

### From Mock Data to Empty States

1. **Identify Components**: Find components with hardcoded mock data
2. **Choose Template**: Select appropriate empty state template
3. **Update Logic**: Replace mock data rendering with empty state
4. **Add Actions**: Include relevant action buttons
5. **Test Integration**: Verify proper rendering and functionality

### Example Migration

**Before:**
```tsx
function LeaveRequestsList() {
  const mockData = [
    { id: 1, title: 'Sample Request' },
    // ... more mock data
  ]
  
  return (
    <div>
      {mockData.map(item => <Item key={item.id} item={item} />)}
    </div>
  )
}
```

**After:**
```tsx
function LeaveRequestsList() {
  const { data: leaveRequests, isLoading, error } = useLeaveRequests()
  
  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorEmpty onAction={() => window.location.reload()} />
  if (!leaveRequests || leaveRequests.length === 0) {
    return <NoLeaveRequestsEmpty onAction={() => router.push('/leave-requests/new')} />
  }
  
  return (
    <div>
      {leaveRequests.map(request => <LeaveRequestCard key={request.id} request={request} />)}
    </div>
  )
}
```

## Contributing

When adding new empty state templates:

1. Create the component in `empty-state-templates.tsx`
2. Add configuration to `empty-state-config.ts`
3. Update integration mappings in `empty-state-integration.ts`
4. Add documentation and examples
5. Include accessibility testing

## Support

For questions or issues with the empty state system:

1. Check this documentation first
2. Review existing templates and configurations
3. Test with the integration utilities
4. Follow the established patterns and best practices