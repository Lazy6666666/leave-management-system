# Responsive Design Implementation

## Overview
This document outlines the responsive design improvements implemented across the Leave Management System to ensure optimal user experience on mobile, tablet, and desktop devices.

## Breakpoints
Following Tailwind CSS default breakpoints:
- **Mobile**: < 640px (default)
- **Tablet (sm)**: ≥ 640px
- **Desktop (md)**: ≥ 768px
- **Large Desktop (lg)**: ≥ 1024px
- **Extra Large (xl)**: ≥ 1280px

## Responsive Spacing System

### Utility Classes
New responsive spacing utilities have been added to `globals.css`:

```css
/* Responsive spacing utilities */
.space-responsive-sm { @apply space-y-3 md:space-y-4; }
.space-responsive-md { @apply space-y-4 md:space-y-6; }
.space-responsive-lg { @apply space-y-6 md:space-y-8; }

.gap-responsive-sm { @apply gap-3 md:gap-4; }
.gap-responsive-md { @apply gap-4 md:gap-6; }
.gap-responsive-lg { @apply gap-6 md:gap-8; }

/* Responsive padding utilities */
.p-responsive-sm { @apply p-3 md:p-4; }
.p-responsive-md { @apply p-4 md:p-6 lg:p-8; }
.p-responsive-lg { @apply p-6 md:p-8 lg:p-12; }
```

### Spacing Guidelines
- **Mobile**: Smaller spacing (12-16px) for compact layouts
- **Tablet**: Medium spacing (16-24px) for balanced layouts
- **Desktop**: Larger spacing (24-32px) for spacious layouts

## Component-Specific Responsive Patterns

### 1. Dashboard Layout

#### Navigation
- **Mobile**: Hamburger menu with Sheet component
- **Desktop**: Fixed sidebar (240px width)
- **Collapsed**: Optional 64px collapsed sidebar

```tsx
// Mobile menu button (visible < lg)
<Button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
  <Menu />
</Button>

// Desktop sidebar (visible ≥ lg)
<div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-60">
  {/* Sidebar content */}
</div>
```

#### Content Padding
- **Mobile**: `px-4` (16px)
- **Tablet**: `md:px-6` (24px)
- **Desktop**: `lg:px-8` (32px)

### 2. Dashboard Index Page

#### Header
- **Mobile**: Stacked layout with smaller text
- **Desktop**: Horizontal layout with larger text

```tsx
<header className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between">
  <h1 className="text-3xl sm:text-4xl lg:text-5xl">...</h1>
</header>
```

#### Stats Grid
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 4 columns

```tsx
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
  {/* StatCard components */}
</div>
```

#### Recent Requests
- **Mobile**: Stacked card layout
- **Desktop**: Horizontal layout with aligned elements

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  {/* Request details */}
</div>
```

### 3. Leave Requests Page

#### Table vs Card View
- **Mobile**: Card view for better readability
- **Desktop**: Table view for data density

```tsx
{/* Desktop Table View */}
<div className="hidden md:block">
  <Table>...</Table>
</div>

{/* Mobile Card View */}
<div className="md:hidden space-y-3 p-4">
  {requests.map(request => (
    <Card>...</Card>
  ))}
</div>
```

#### Leave Balance Cards
- **Mobile**: 1 column (stacked)
- **Tablet**: 3 columns (side by side)

```tsx
<div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
  {/* Balance cards */}
</div>
```

### 4. Admin Dashboard

#### Stats Grid
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3 columns

```tsx
<div className="grid gap-4 md:gap-6 sm:grid-cols-2 xl:grid-cols-3">
  {/* StatCard components */}
</div>
```

#### Summary Stats
- **Mobile**: 2 columns
- **Desktop**: 4 columns

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
  {/* Summary stats */}
</div>
```

### 5. Login Page

#### Form Container
- **Mobile**: Full width with padding
- **Desktop**: Centered with max-width

```tsx
<div className="flex-1 flex items-center justify-center p-4 md:p-6">
  <div className="w-full max-w-md space-y-4 md:space-y-6">
    {/* Login form */}
  </div>
</div>
```

#### Form Spacing
- **Mobile**: Tighter spacing (12px)
- **Desktop**: Standard spacing (16px)

```tsx
<form className="space-y-3 md:space-y-4">
  {/* Form fields */}
</form>
```

## Typography Responsive Patterns

### Headings
```tsx
// Page titles
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Section titles
<h2 className="text-xl md:text-2xl">

// Card titles
<h3 className="text-lg md:text-xl">
```

### Body Text
```tsx
// Standard text
<p className="text-sm md:text-base">

// Descriptions
<p className="text-xs md:text-sm text-muted-foreground">
```

## Button Responsive Patterns

### Button Text
```tsx
// Show abbreviated text on mobile
<Button>
  <Plus className="h-4 w-4 mr-2" />
  <span className="hidden sm:inline">New Request</span>
  <span className="sm:hidden">New</span>
</Button>
```

### Button Width
```tsx
// Full width on mobile, auto on desktop
<Button className="w-full sm:w-auto">
  Submit
</Button>
```

## Form Responsive Patterns

### Field Layout
```tsx
// Stacked on mobile, side-by-side on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField name="startDate" />
  <FormField name="endDate" />
</div>
```

### Dialog/Modal
```tsx
// Full screen on mobile, centered on desktop
<DialogContent className="sm:max-w-[600px]">
  {/* Form content */}
</DialogContent>
```

## Testing Responsive Design

### Manual Testing Checklist
- [ ] Test all pages at 375px (mobile)
- [ ] Test all pages at 768px (tablet)
- [ ] Test all pages at 1280px (desktop)
- [ ] Test navigation on mobile (hamburger menu)
- [ ] Test tables switch to card view on mobile
- [ ] Test forms are usable on mobile
- [ ] Test button text is readable on all sizes
- [ ] Test spacing is appropriate at each breakpoint
- [ ] Test images and icons scale properly
- [ ] Test modals/dialogs work on mobile

### Automated Testing
Responsive design tests are located in:
- `frontend/e2e/responsive-design.spec.ts`

Run tests with:
```bash
npm run test:e2e
```

## Browser DevTools Testing

### Chrome DevTools
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device presets or custom dimensions
4. Test at different viewport sizes

### Recommended Test Viewports
- **Mobile**: 375x667 (iPhone SE)
- **Mobile Landscape**: 667x375
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1280x720
- **Large Desktop**: 1920x1080

## Common Responsive Issues and Solutions

### Issue: Text Overflow
**Solution**: Use `truncate` or `line-clamp` utilities
```tsx
<p className="truncate">Long text that might overflow</p>
<p className="line-clamp-2">Text limited to 2 lines</p>
```

### Issue: Horizontal Scroll
**Solution**: Ensure proper container constraints
```tsx
<div className="max-w-full overflow-x-auto">
  <Table />
</div>
```

### Issue: Touch Targets Too Small
**Solution**: Ensure minimum 44x44px touch targets
```tsx
<Button size="default"> {/* Minimum 40px height */}
  Click Me
</Button>
```

### Issue: Images Not Scaling
**Solution**: Use responsive image utilities
```tsx
<img className="w-full h-auto" src="..." alt="..." />
```

## Performance Considerations

### Mobile Optimization
- Reduce animation complexity on mobile
- Use smaller images for mobile viewports
- Lazy load off-screen content
- Minimize JavaScript bundle size

### CSS Optimization
- Use Tailwind's purge to remove unused styles
- Minimize custom CSS
- Use CSS containment where appropriate

## Accessibility in Responsive Design

### Touch Targets
- Minimum 44x44px for touch targets
- Adequate spacing between interactive elements

### Focus Indicators
- Ensure focus indicators are visible at all sizes
- Test keyboard navigation on all viewports

### Screen Reader Support
- Ensure content order makes sense when linearized
- Test with mobile screen readers (VoiceOver, TalkBack)

## Future Improvements

### Potential Enhancements
1. Add container queries for component-level responsiveness
2. Implement responsive images with `srcset`
3. Add print styles for reports
4. Optimize for foldable devices
5. Add landscape-specific optimizations for mobile

### Monitoring
- Track mobile vs desktop usage
- Monitor performance metrics by device type
- Collect user feedback on mobile experience
- Use analytics to identify problem areas

## Resources

### Documentation
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev Responsive Design](https://web.dev/responsive-web-design-basics/)

### Tools
- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- BrowserStack for real device testing
- Lighthouse for mobile performance audits
