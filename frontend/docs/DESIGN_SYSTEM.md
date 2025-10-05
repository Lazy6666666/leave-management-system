# Design System Documentation

Complete design system documentation for the Leave Management System UI/UX enhancement.

## Overview

This design system provides a comprehensive set of guidelines, components, and utilities to ensure consistency, accessibility, and maintainability across the Leave Management System.

## Requirements Addressed

- **Requirement 1.1**: Unified design system across all pages
- **Requirement 2.1**: 8-point spacing system
- **Requirement 3.1**: Semantic color system
- **Requirement 8.1**: Consistent component patterns

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Components](#components)
6. [Responsive Design](#responsive-design)
7. [Accessibility](#accessibility)
8. [Animations](#animations)

## Design Principles

### 1. Consistency
- Use design tokens for all visual properties
- Follow established patterns for similar interactions
- Maintain consistent spacing and typography

### 2. Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast

### 3. Responsiveness
- Mobile-first approach
- Fluid layouts that adapt to screen size
- Touch-friendly targets (minimum 44x44px)

### 4. Performance
- Optimized animations
- Efficient component rendering
- Respect user preferences (prefers-reduced-motion)

### 5. Clarity
- Clear visual hierarchy
- Descriptive labels and instructions
- Meaningful feedback for user actions

## Color System

### Base Colors

#### Light Mode
```css
--background: 0 0% 100%        /* White */
--foreground: 240 10% 3.9%     /* Near black */
--primary: 221.2 83.2% 53.3%   /* Blue */
--secondary: 240 4.8% 95.9%    /* Light gray */
--muted: 240 4.8% 95.9%        /* Light gray */
--accent: 240 4.8% 95.9%       /* Light gray */
```

#### Dark Mode
```css
--background: 222.2 84% 4.9%   /* Dark blue-gray */
--foreground: 210 40% 98%      /* Off-white */
--primary: 217.2 91.2% 59.8%   /* Bright blue */
--secondary: 217.2 32.6% 17.5% /* Dark gray-blue */
--muted: 217.2 32.6% 17.5%     /* Dark gray-blue */
--accent: 217.2 32.6% 17.5%    /* Dark gray-blue */
```

### Semantic Colors

#### Success (Green)
- **Purpose**: Approved requests, positive feedback, success states
- **Light**: `142.1 76.2% 36.3%`
- **Dark**: `142.1 70.6% 45.3%`
- **Variants**: `success`, `success-foreground`, `success-subtle`, `success-strong`

#### Destructive (Red)
- **Purpose**: Rejected requests, errors, destructive actions
- **Light**: `0 84.2% 60.2%`
- **Dark**: `0 62.8% 30.6%`
- **Variants**: `destructive`, `destructive-foreground`, `destructive-subtle`, `destructive-strong`

#### Warning (Yellow)
- **Purpose**: Pending requests, warnings, caution states
- **Light**: `48 96% 53%`
- **Dark**: `48 96% 53%`
- **Variants**: `warning`, `warning-foreground`, `warning-subtle`, `warning-strong`

#### Info (Blue)
- **Purpose**: Informational messages, neutral states
- **Light**: `217.2 91.2% 59.8%`
- **Dark**: `217.2 91.2% 59.8%`
- **Variants**: `info`, `info-foreground`, `info-subtle`, `info-strong`

### Color Usage Guidelines

#### Text Colors
```tsx
// Primary text
<p className="text-foreground">Main content</p>

// Secondary text
<p className="text-muted-foreground">Supporting text</p>

// Semantic text
<p className="text-success-strong">Approved</p>
<p className="text-destructive-strong">Rejected</p>
<p className="text-warning-strong">Pending</p>
```

#### Background Colors
```tsx
// Card backgrounds
<div className="bg-card">Card content</div>

// Semantic backgrounds
<div className="bg-success-subtle">Success message</div>
<div className="bg-destructive-subtle">Error message</div>
<div className="bg-warning-subtle">Warning message</div>
```

#### Border Colors
```tsx
// Default border
<div className="border border-border">Content</div>

// Semantic borders
<div className="border border-success-subtle">Success</div>
<div className="border border-destructive-subtle">Error</div>
```

### Color Contrast

All color combinations meet WCAG 2.1 Level AA requirements:
- **Normal text**: 4.5:1 contrast ratio
- **Large text**: 3:1 contrast ratio
- **UI components**: 3:1 contrast ratio

## Typography

### Type Scale

Based on a modular scale with consistent line heights and weights:

```tsx
// Display (Hero text)
<h1 className="text-display">Display Text</h1>
// 3.75rem (60px), bold, tight tracking

// Heading 1
<h1 className="text-h1">Heading 1</h1>
// 2.25rem (36px), bold, tight tracking

// Heading 2
<h2 className="text-h2">Heading 2</h2>
// 1.875rem (30px), semibold, tight tracking

// Heading 3
<h3 className="text-h3">Heading 3</h3>
// 1.5rem (24px), semibold

// Heading 4
<h4 className="text-h4">Heading 4</h4>
// 1.25rem (20px), semibold

// Heading 5
<h5 className="text-h5">Heading 5</h5>
// 1.125rem (18px), semibold

// Heading 6
<h6 className="text-h6">Heading 6</h6>
// 1rem (16px), semibold

// Body Large
<p className="text-body-large">Large body text</p>
// 1.125rem (18px), normal weight

// Body (Default)
<p className="text-body">Body text</p>
// 1rem (16px), normal weight

// Body Small
<p className="text-body-small">Small body text</p>
// 0.875rem (14px), normal weight

// Label
<label className="text-label">Label text</label>
// 0.875rem (14px), medium weight

// Caption
<span className="text-caption">Caption text</span>
// 0.75rem (12px), normal weight
```

### Font Weights

```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### Line Heights

- **Tight**: 1.1-1.2 (Display, H1)
- **Snug**: 1.3 (H2)
- **Normal**: 1.4-1.5 (H3-H6, Small text)
- **Relaxed**: 1.6 (Body text)

### Typography Guidelines

1. **Hierarchy**: Use heading levels semantically (h1 → h2 → h3)
2. **Consistency**: Use utility classes for consistent styling
3. **Readability**: Maintain appropriate line length (45-75 characters)
4. **Contrast**: Ensure text meets contrast requirements

## Spacing System

### 8-Point Grid

All spacing follows an 8-point grid system for consistency:

```css
0:  0px
1:  4px   (0.5 × 8)
2:  8px   (1 × 8)
3:  12px  (1.5 × 8)
4:  16px  (2 × 8)
5:  20px  (2.5 × 8)
6:  24px  (3 × 8)
8:  32px  (4 × 8)
10: 40px  (5 × 8)
12: 48px  (6 × 8)
16: 64px  (8 × 8)
20: 80px  (10 × 8)
24: 96px  (12 × 8)
```

### Spacing Utilities

#### Fixed Spacing
```tsx
// Vertical spacing
<div className="space-y-4">Children with 16px gap</div>
<div className="space-y-6">Children with 24px gap</div>

// Gap (for flex/grid)
<div className="gap-4">16px gap</div>
<div className="gap-6">24px gap</div>

// Padding
<div className="p-4">16px padding</div>
<div className="px-6 py-4">24px horizontal, 16px vertical</div>

// Margin
<div className="mt-6 mb-4">24px top, 16px bottom</div>
```

#### Semantic Spacing
```tsx
// Micro spacing (4px)
<div className="space-micro">Tight spacing</div>
<div className="gap-micro">Tight gap</div>

// Small spacing (12px)
<div className="space-small">Small spacing</div>
<div className="gap-small">Small gap</div>

// Medium spacing (24px)
<div className="space-medium">Medium spacing</div>
<div className="gap-medium">Medium gap</div>

// Large spacing (48px)
<div className="space-large">Large spacing</div>
<div className="gap-large">Large gap</div>
```

#### Responsive Spacing
```tsx
// Responsive vertical spacing
<div className="space-responsive-sm">12px → 16px</div>
<div className="space-responsive-md">16px → 24px</div>
<div className="space-responsive-lg">24px → 32px</div>

// Responsive gap
<div className="gap-responsive-sm">12px → 16px</div>
<div className="gap-responsive-md">16px → 24px</div>
<div className="gap-responsive-lg">24px → 32px</div>

// Responsive padding
<div className="p-responsive-sm">12px → 16px</div>
<div className="p-responsive-md">16px → 24px → 32px</div>
<div className="p-responsive-lg">24px → 32px → 48px</div>
```

### Spacing Guidelines

1. **Consistency**: Use spacing scale values, avoid arbitrary values
2. **Hierarchy**: More spacing between sections, less within components
3. **Responsive**: Reduce spacing on mobile, increase on desktop
4. **Breathing Room**: Ensure adequate whitespace around elements

## Components

### Component Categories

1. **Base Components**: Button, Input, Card, Badge
2. **Composite Components**: StatCard, LeaveCard, PageHeader
3. **Layout Components**: Container, Grid, Stack
4. **Navigation Components**: Sidebar, MobileNav, Breadcrumbs
5. **Feedback Components**: Alert, Toast, Dialog, EmptyState

### Component Documentation

See individual component documentation:
- [Button Component](./COMPONENT_BUTTON.md)
- [Card Component](./COMPONENT_CARD.md)
- [Form Components](./COMPONENT_FORMS.md)
- [Status Indicators](./STATUS_VISUAL_REFERENCE.md)

### Component Patterns

#### Consistent Props
```tsx
// Size variants
size?: 'sm' | 'md' | 'lg'

// Visual variants
variant?: 'default' | 'outline' | 'ghost' | 'destructive'

// State props
disabled?: boolean
loading?: boolean
```

#### Composition
```tsx
// Compose components for flexibility
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## Responsive Design

### Breakpoints

```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Responsive Patterns

#### Mobile-First Approach
```tsx
// Base styles for mobile, then override for larger screens
<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>
```

#### Container Widths
```tsx
// Page container (max-width with responsive padding)
<div className="container-page">
  Full-width content with max-width
</div>

// Narrow container (for forms, articles)
<div className="container-narrow">
  Centered narrow content
</div>
```

#### Responsive Layouts
```tsx
// Stack on mobile, grid on desktop
<div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

#### Responsive Typography
```tsx
// Smaller on mobile, larger on desktop
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive heading
</h1>
```

### Responsive Guidelines

1. **Mobile-First**: Design for mobile, enhance for desktop
2. **Touch Targets**: Minimum 44x44px on mobile
3. **Readable Text**: Minimum 16px font size on mobile
4. **Adequate Spacing**: More compact on mobile, spacious on desktop
5. **Navigation**: Hamburger menu on mobile, sidebar on desktop

## Accessibility

### Focus Indicators

All interactive elements have visible focus indicators:

```css
*:focus-visible {
  outline: none;
  ring: 2px solid hsl(var(--ring));
  ring-offset: 2px;
}
```

### ARIA Labels

```tsx
// Icon-only buttons
<button aria-label="Delete request">
  <TrashIcon />
</button>

// Form inputs
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Status indicators
<Badge>
  <span className="sr-only">Status: </span>
  Approved
</Badge>
```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Logical tab order
- Skip links for bypassing navigation
- Escape key closes dialogs

### Screen Reader Support

- Semantic HTML elements
- Proper heading hierarchy
- ARIA roles and attributes
- Live regions for dynamic content

See [Accessibility Testing Guide](./ACCESSIBILITY_TESTING_CHECKLIST.md) for details.

## Animations

### Animation Utilities

```tsx
// Fade in
<div className="animate-fade-in">Fades in on mount</div>

// Slide in
<div className="animate-slide-in">Slides in from left</div>
<div className="animate-slide-in-right">Slides in from right</div>

// Scale in
<div className="animate-scale-in">Scales in</div>

// Staggered animations
<div className="animate-stagger">
  <div>Item 1 (0ms delay)</div>
  <div>Item 2 (50ms delay)</div>
  <div>Item 3 (100ms delay)</div>
</div>
```

### Micro-Interactions

```tsx
// Hover lift
<button className="hover-lift">Lifts on hover</button>

// Hover glow
<button className="hover-glow">Glows on hover</button>

// Hover scale
<button className="hover-scale">Scales on hover</button>

// Active scale
<button className="active-scale">Scales down on click</button>

// Interactive (combined effects)
<button className="interactive">All interactions</button>
```

### Animation Guidelines

1. **Subtle**: Animations should enhance, not distract
2. **Fast**: Keep animations under 300ms
3. **Purposeful**: Animate to provide feedback or guide attention
4. **Respectful**: Honor prefers-reduced-motion preference

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Usage Examples

### Page Layout

```tsx
<div className="container-page py-responsive-md">
  <PageHeader
    title="Dashboard"
    description="Overview of your leave requests"
  />
  
  <div className="space-responsive-lg">
    <section>
      <h2 className="text-h3 mb-4">Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-responsive-md">
        <StatCard label="Total Requests" value="24" />
        <StatCard label="Approved" value="18" variant="success" />
        <StatCard label="Pending" value="4" variant="warning" />
        <StatCard label="Rejected" value="2" variant="destructive" />
      </div>
    </section>
    
    <section>
      <h2 className="text-h3 mb-4">Recent Requests</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            {/* Table content */}
          </Table>
        </CardContent>
      </Card>
    </section>
  </div>
</div>
```

### Form Layout

```tsx
<Card className="card-padding-default">
  <CardHeader>
    <CardTitle>New Leave Request</CardTitle>
    <CardDescription>Submit a new leave request</CardDescription>
  </CardHeader>
  
  <CardContent>
    <form className="space-y-4">
      <div>
        <Label htmlFor="type">Leave Type</Label>
        <Select id="type">
          <option>Vacation</option>
          <option>Sick Leave</option>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start">Start Date</Label>
          <Input id="start" type="date" />
        </div>
        <div>
          <Label htmlFor="end">End Date</Label>
          <Input id="end" type="date" />
        </div>
      </div>
      
      <div>
        <Label htmlFor="reason">Reason</Label>
        <Textarea id="reason" rows={4} />
      </div>
    </form>
  </CardContent>
  
  <CardFooter className="flex justify-end gap-3">
    <Button variant="outline">Cancel</Button>
    <Button>Submit Request</Button>
  </CardFooter>
</Card>
```

## Best Practices

### Do's ✅

- Use design tokens for all visual properties
- Follow the 8-point spacing system
- Use semantic color variants
- Ensure WCAG 2.1 Level AA compliance
- Test on multiple devices and screen sizes
- Use responsive utilities
- Provide keyboard navigation
- Include ARIA labels where needed

### Don'ts ❌

- Don't use arbitrary spacing values
- Don't rely on color alone to convey information
- Don't skip heading levels
- Don't create custom colors outside the system
- Don't ignore accessibility requirements
- Don't use animations that can't be disabled
- Don't make touch targets smaller than 44x44px
- Don't forget to test with keyboard and screen readers

## Resources

- [Component Library](./COMPONENT_LIBRARY.md)
- [Spacing Guide](./SPACING_GUIDE.md)
- [Color Guide](./COLOR_GUIDE.md)
- [Responsive Design Patterns](./RESPONSIVE_PATTERNS.md)
- [Accessibility Checklist](./ACCESSIBILITY_TESTING_CHECKLIST.md)
- [Visual Reference](./STATUS_VISUAL_REFERENCE.md)
