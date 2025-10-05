# shadcn/ui Components

This directory contains all shadcn/ui components used in the Leave Management System.

## Installed Components

### Data Display
- **Table** (`table.tsx`) - For leave request lists and admin views
  - Includes: Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption
  - Features: Responsive, accessible, with hover states

- **Badge** (`badge.tsx`) - For status indicators
  - Variants: default, secondary, destructive, outline

- **Card** (`card.tsx`) - For content containers
  - Includes: Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent

- **Avatar** (`avatar.tsx`) - For user profile images
  - Includes: Avatar, AvatarImage, AvatarFallback

- **Separator** (`separator.tsx`) - For visual dividers

### Forms & Inputs
- **Form** (`form.tsx`) - For structured form handling with validation
  - Includes: Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField
  - Integrates with React Hook Form

- **Input** (`input.tsx`) - For text inputs

- **Textarea** (`textarea.tsx`) - For multi-line text inputs (leave reasons)

- **Checkbox** (`checkbox.tsx`) - For multi-select options

- **Radio Group** (`radio-group.tsx`) - For single-select options (leave types)

- **Select** (`select.tsx`) - For dropdown selections

- **Label** (`label.tsx`) - For form field labels

### Overlays & Dialogs
- **Dialog** (`dialog.tsx`) - For modals and confirmations
  - Includes: Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
  - Features: Accessible, keyboard navigation, focus trap

- **Sheet** (`sheet.tsx`) - For mobile navigation and side panels
  - Variants: left, right, top, bottom
  - Features: Responsive, slide animations

- **Popover** (`popover.tsx`) - For additional information tooltips
  - Includes: Popover, PopoverTrigger, PopoverContent

- **Dropdown Menu** (`dropdown-menu.tsx`) - For action menus

### Navigation
- **Tabs** (`tabs.tsx`) - For dashboard sections
  - Includes: Tabs, TabsList, TabsTrigger, TabsContent

- **Navigation Menu** (`navigation-menu.tsx`) - For main navigation

### Feedback
- **Alert** (`alert.tsx`) - For notifications and messages
  - Variants: default, destructive
  - Includes: Alert, AlertTitle, AlertDescription

- **Toast** (`toast.tsx`, `toaster.tsx`) - For temporary notifications

- **Progress** (`progress.tsx`) - For leave balance indicators

- **Skeleton** (`skeleton.tsx`) - For loading states

### Utilities
- **Scroll Area** (`scroll-area.tsx`) - For scrollable content
  - Features: Custom scrollbar styling, smooth scrolling

- **Calendar** (`calendar.tsx`) - For date selection

## Usage Guidelines

### Importing Components
```typescript
import { Button } from '@/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/ui/form'
```

### Accessibility
All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader announcements

### Theming
Components support:
- Light and dark modes via CSS variables
- Customizable via Tailwind classes
- Consistent with design system tokens

### TypeScript
All components are fully typed with:
- Proper prop types
- Generic support where applicable
- Ref forwarding

## Configuration

Components are configured via `components.json`:
- Style: new-york
- Base color: neutral
- CSS variables: enabled
- Icon library: lucide-react

## Testing

All components should be tested for:
- Accessibility (WCAG 2.1 AA)
- Keyboard navigation
- Screen reader compatibility
- Visual regression
- Responsive behavior
