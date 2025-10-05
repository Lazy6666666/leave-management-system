# Component Library

Comprehensive documentation of all UI components in the Leave Management System.

## Requirements Addressed

- **Requirement 1.2**: Consistent component usage
- **Requirement 1.3**: Component variants and states
- **Requirement 8.1**: Component patterns

## Overview

The component library provides reusable, accessible, and consistent UI components built on top of Radix UI primitives and styled with Tailwind CSS.

## Component Categories

### Base Components
- [Button](#button)
- [Input](#input)
- [Label](#label)
- [Card](#card)
- [Badge](#badge)
- [Separator](#separator)

### Form Components
- [Form](#form)
- [Select](#select)
- [Textarea](#textarea)
- [Checkbox](#checkbox)
- [Radio Group](#radio-group)

### Feedback Components
- [Alert](#alert)
- [Toast](#toast)
- [Dialog](#dialog)
- [Progress](#progress)
- [Skeleton](#skeleton)

### Navigation Components
- [Tabs](#tabs)
- [Sheet](#sheet)
- [Scroll Area](#scroll-area)

### Data Display Components
- [Table](#table)
- [Popover](#popover)

### Composite Components
- [StatCard](#statcard)
- [LeaveCard](#leavecard)
- [PageHeader](#pageheader)
- [EmptyState](#emptystate)

## Base Components

### Button

Interactive button component with multiple variants and sizes.

#### Variants
- `default` - Primary action button
- `destructive` - Dangerous or destructive actions
- `outline` - Secondary actions
- `secondary` - Alternative secondary style
- `ghost` - Minimal style for tertiary actions
- `link` - Link-styled button

#### Sizes
- `default` - Standard size (h-10 px-4 py-2)
- `sm` - Small size (h-9 px-3)
- `lg` - Large size (h-11 px-8)
- `icon` - Square icon button (h-10 w-10)

#### Usage
```tsx
import { Button } from '@/components/ui/button';

// Primary button
<Button>Submit</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Outline button
<Button variant="outline">Cancel</Button>

// Small button
<Button size="sm">Small</Button>

// Icon button
<Button size="icon">
  <PlusIcon className="h-4 w-4" />
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// With icon
<Button>
  <PlusIcon className="mr-2 h-4 w-4" />
  Add Item
</Button>
```

#### Accessibility
- Keyboard accessible (Enter/Space)
- Focus visible
- Disabled state
- ARIA labels for icon-only buttons

### Input

Text input component with support for various types.

#### Usage
```tsx
import { Input } from '@/components/ui/input';

// Basic input
<Input type="text" placeholder="Enter text" />

// Email input
<Input type="email" placeholder="email@example.com" />

// Password input
<Input type="password" placeholder="Password" />

// With label
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// Disabled
<Input disabled placeholder="Disabled" />

// With error
<Input className="border-destructive" />
```

#### Accessibility
- Associated with label
- Error states announced
- Keyboard accessible
- Proper input types

### Card

Container component for grouping related content.

#### Variants
- `default` - Standard card
- `elevated` - Card with shadow
- `outlined` - Card with border only
- `ghost` - Minimal card

#### Usage
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Compact card
<Card className="card-padding-compact">
  <p>Compact content</p>
</Card>

// Interactive card
<Card className="card-interactive cursor-pointer">
  <CardContent>
    Clickable card
  </CardContent>
</Card>
```

### Badge

Small label component for status indicators.

#### Variants
- `default` - Default badge
- `secondary` - Secondary badge
- `destructive` - Error/rejected badge
- `success` - Success/approved badge
- `warning` - Warning/pending badge
- `info` - Informational badge
- `outline` - Outlined badge

#### Usage
```tsx
import { Badge } from '@/components/ui/badge';

// Status badges
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Rejected</Badge>

// With icon
<Badge variant="success">
  <CheckIcon className="mr-1 h-3 w-3" />
  Approved
</Badge>

// Outline variant
<Badge variant="outline">Draft</Badge>
```

#### Accessibility
- Include status text (not just color)
- Use sr-only for screen readers
```tsx
<Badge variant="success">
  <span className="sr-only">Status: </span>
  Approved
</Badge>
```

## Form Components

### Form

Form component with validation using React Hook Form and Zod.

#### Usage
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription>
                Your email address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Select

Dropdown select component.

#### Usage
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>

// With form
<FormField
  control={form.control}
  name="type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Leave Type</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="vacation">Vacation</SelectItem>
          <SelectItem value="sick">Sick Leave</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Feedback Components

### Alert

Alert component for displaying important messages.

#### Variants
- `default` - Default alert
- `destructive` - Error alert
- `success` - Success alert
- `warning` - Warning alert

#### Usage
```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

// Success alert
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>
    Your changes have been saved successfully.
  </AlertDescription>
</Alert>

// Error alert
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong. Please try again.
  </AlertDescription>
</Alert>

// Warning alert
<Alert variant="warning">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>
    This action cannot be undone.
  </AlertDescription>
</Alert>
```

### Dialog

Modal dialog component.

#### Usage
```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description goes here.
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-4">
      Dialog content
    </div>
    
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Accessibility
- Focus trapped in dialog
- Escape key closes dialog
- Focus returns to trigger
- ARIA attributes

### Skeleton

Loading skeleton component.

#### Usage
```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Basic skeleton
<Skeleton className="h-4 w-full" />

// Card skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2 mt-2" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-20 w-full" />
  </CardContent>
</Card>

// List skeleton
<div className="space-y-3">
  {[...Array(3)].map((_, i) => (
    <Skeleton key={i} className="h-16 w-full" />
  ))}
</div>
```

## Data Display Components

### Table

Table component for displaying tabular data.

#### Usage
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Date</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell>
          <Badge variant={item.statusVariant}>{item.status}</Badge>
        </TableCell>
        <TableCell>{item.date}</TableCell>
        <TableCell className="text-right">
          <Button size="sm" variant="ghost">View</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Accessibility
- Proper table structure (thead, tbody, th)
- Column headers
- Keyboard navigation

## Composite Components

### StatCard

Card component for displaying statistics.

#### Usage
```tsx
import { StatCard } from '@/components/features/stat-card';

<StatCard
  label="Total Requests"
  value="24"
  icon={<FileTextIcon />}
/>

<StatCard
  label="Approved"
  value="18"
  variant="success"
  icon={<CheckCircleIcon />}
/>

<StatCard
  label="Pending"
  value="4"
  variant="warning"
  icon={<ClockIcon />}
  trend={{ value: 12, direction: 'up' }}
/>
```

### LeaveCard

Card component for displaying leave request information.

#### Usage
```tsx
import { LeaveCard } from '@/components/features/leave-card';

<LeaveCard
  leave={{
    id: '1',
    type: 'Vacation',
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    status: 'approved',
    reason: 'Family vacation',
  }}
  onView={() => {}}
  onEdit={() => {}}
  onDelete={() => {}}
/>
```

### PageHeader

Header component for pages.

#### Usage
```tsx
import { PageHeader } from '@/components/features/page-header';

<PageHeader
  title="Dashboard"
  description="Overview of your leave requests"
/>

<PageHeader
  title="Leave Requests"
  description="Manage your leave requests"
  action={
    <Button>
      <PlusIcon className="mr-2 h-4 w-4" />
      New Request
    </Button>
  }
/>
```

### EmptyState

Component for displaying empty states.

#### Usage
```tsx
import { EmptyState } from '@/components/features/empty-state';

<EmptyState
  icon={<InboxIcon />}
  title="No leave requests"
  description="You haven't submitted any leave requests yet."
  action={
    <Button>
      <PlusIcon className="mr-2 h-4 w-4" />
      Create Request
    </Button>
  }
/>
```

## Component Patterns

### Composition

Components are designed to be composed:

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </div>
      <Badge>Status</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <p>Content</p>
      <Separator />
      <div className="flex gap-2">
        <Button size="sm">Action 1</Button>
        <Button size="sm" variant="outline">Action 2</Button>
      </div>
    </div>
  </CardContent>
</Card>
```

### Responsive Components

Components adapt to screen size:

```tsx
// Mobile: Full width button, Desktop: Auto width
<Button className="w-full md:w-auto">Submit</Button>

// Mobile: Card view, Desktop: Table view
<div>
  <div className="md:hidden">
    <LeaveCard />
  </div>
  <div className="hidden md:block">
    <Table />
  </div>
</div>
```

### Loading States

Components support loading states:

```tsx
// Button loading
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// Skeleton loading
{isLoading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <Card>Content</Card>
)}
```

## Best Practices

### Do's ✅

- Use semantic component variants
- Compose components for flexibility
- Provide loading states
- Include accessibility attributes
- Use consistent spacing
- Follow responsive patterns
- Test keyboard navigation
- Provide error states

### Don'ts ❌

- Don't create custom components for one-off use
- Don't bypass component APIs
- Don't ignore accessibility
- Don't use inline styles
- Don't forget loading states
- Don't skip error handling
- Don't ignore responsive design

## Resources

- [Design System](./DESIGN_SYSTEM.md)
- [Spacing Guide](./SPACING_GUIDE.md)
- [Color Guide](./COLOR_GUIDE.md)
- [Responsive Patterns](./RESPONSIVE_PATTERNS.md)
- [Radix UI Documentation](https://www.radix-ui.com/)
