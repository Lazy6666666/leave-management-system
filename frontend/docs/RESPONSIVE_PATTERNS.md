# Responsive Design Patterns

Comprehensive guide to responsive design patterns used throughout the Leave Management System.

## Requirements Addressed

- **Requirement 2.5**: Responsive design across devices
- **Requirement 7.2**: Mobile-optimized navigation
- **Requirement 7.3**: Touch-friendly interfaces

## Overview

The application uses a mobile-first approach with responsive patterns that adapt to different screen sizes and devices.

## Breakpoints

### Tailwind Breakpoints

```css
/* Mobile first (default) */
/* < 640px */

sm: 640px   /* Small tablets, large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops, small desktops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Usage

```tsx
// Mobile first: base styles, then override for larger screens
<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>
```

## Layout Patterns

### 1. Container Pattern

Centered content with max-width and responsive padding.

```tsx
// Page container (max-width: 1280px)
<div className="container-page">
  <h1>Page Title</h1>
  <p>Content with responsive padding</p>
</div>

// Narrow container (max-width: 896px)
<div className="container-narrow">
  <form>Form content</form>
</div>

// Custom container
<div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
  Custom container
</div>
```

### 2. Grid Pattern

Responsive grid that adapts columns based on screen size.

```tsx
// 1 column → 2 columns → 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>

// 1 column → 2 columns → 4 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-responsive-md">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>

// Auto-fit grid (responsive without breakpoints)
<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
  <Card>Auto-sized</Card>
  <Card>Auto-sized</Card>
</div>
```

### 3. Stack Pattern

Vertical stack on mobile, horizontal on desktop.

```tsx
// Stack → Row
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">Content 1</div>
  <div className="flex-1">Content 2</div>
</div>

// Stack → Row with different widths
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="lg:w-64">Sidebar</aside>
  <main className="flex-1">Main content</main>
</div>
```

### 4. Sidebar Pattern

Hidden sidebar on mobile, visible on desktop.

```tsx
// Mobile: Hidden, Desktop: Fixed sidebar
<div className="flex">
  {/* Sidebar - hidden on mobile */}
  <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
    <nav>Navigation</nav>
  </aside>
  
  {/* Main content - full width on mobile, with left margin on desktop */}
  <main className="flex-1 lg:pl-64">
    <div className="container-page">
      Content
    </div>
  </main>
</div>

// Mobile: Sheet/Drawer, Desktop: Fixed sidebar
<div className="flex">
  {/* Mobile menu button */}
  <button className="lg:hidden" onClick={openMobileMenu}>
    <MenuIcon />
  </button>
  
  {/* Mobile sheet */}
  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
    <SheetContent side="left">
      <nav>Navigation</nav>
    </SheetContent>
  </Sheet>
  
  {/* Desktop sidebar */}
  <aside className="hidden lg:flex lg:w-64">
    <nav>Navigation</nav>
  </aside>
  
  <main className="flex-1">Content</main>
</div>
```

### 5. Table Pattern

Card view on mobile, table on desktop.

```tsx
// Mobile: Cards, Desktop: Table
<div>
  {/* Mobile card view */}
  <div className="md:hidden space-y-4">
    {items.map(item => (
      <Card key={item.id}>
        <CardHeader>
          <CardTitle>{item.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd><Badge>{item.status}</Badge></dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Date</dt>
              <dd>{item.date}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    ))}
  </div>
  
  {/* Desktop table view */}
  <div className="hidden md:block">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.title}</TableCell>
            <TableCell><Badge>{item.status}</Badge></TableCell>
            <TableCell>{item.date}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</div>
```

## Component Patterns

### 1. Responsive Typography

```tsx
// Smaller on mobile, larger on desktop
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

<p className="text-sm md:text-base lg:text-lg">
  Responsive body text
</p>

// Using utility classes
<h1 className="text-h1">Heading 1</h1>
<p className="text-body">Body text</p>
```

### 2. Responsive Spacing

```tsx
// Padding
<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>

// Margin
<div className="mt-4 md:mt-6 lg:mt-8">
  Responsive margin
</div>

// Gap
<div className="grid grid-cols-2 gap-4 md:gap-6 lg:gap-8">
  Responsive gap
</div>

// Using utility classes
<div className="p-responsive-md">
  16px → 24px → 32px padding
</div>

<div className="gap-responsive-md">
  16px → 24px gap
</div>
```

### 3. Responsive Cards

```tsx
// Compact on mobile, spacious on desktop
<Card className="card-padding-compact md:card-padding-default lg:card-padding-spacious">
  <CardHeader>
    <CardTitle className="text-lg md:text-xl">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm md:text-base">Content</p>
  </CardContent>
</Card>
```

### 4. Responsive Buttons

```tsx
// Full width on mobile, auto width on desktop
<Button className="w-full md:w-auto">
  Submit
</Button>

// Icon only on mobile, text + icon on desktop
<Button>
  <PlusIcon className="h-4 w-4 md:mr-2" />
  <span className="hidden md:inline">Add Item</span>
</Button>

// Different sizes
<Button size="sm" className="md:size-default lg:size-lg">
  Responsive size
</Button>
```

### 5. Responsive Forms

```tsx
// Single column on mobile, two columns on desktop
<form className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <Label htmlFor="firstName">First Name</Label>
      <Input id="firstName" />
    </div>
    <div>
      <Label htmlFor="lastName">Last Name</Label>
      <Input id="lastName" />
    </div>
  </div>
  
  <div>
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" />
  </div>
  
  <div className="flex flex-col-reverse md:flex-row justify-end gap-3">
    <Button variant="outline" className="w-full md:w-auto">
      Cancel
    </Button>
    <Button className="w-full md:w-auto">
      Submit
    </Button>
  </div>
</form>
```

### 6. Responsive Navigation

```tsx
// Mobile: Hamburger menu, Desktop: Horizontal nav
<header className="border-b">
  <div className="container-page flex items-center justify-between h-16">
    <Logo />
    
    {/* Mobile menu button */}
    <button className="lg:hidden" onClick={toggleMenu}>
      <MenuIcon />
    </button>
    
    {/* Desktop navigation */}
    <nav className="hidden lg:flex items-center gap-6">
      <a href="/dashboard">Dashboard</a>
      <a href="/leaves">Leaves</a>
      <a href="/team">Team</a>
    </nav>
  </div>
</header>
```

## Touch-Friendly Design

### Touch Target Sizes

Minimum 44x44px for all interactive elements on mobile.

```tsx
// Button with adequate size
<Button size="default" className="min-h-[44px] min-w-[44px]">
  Click me
</Button>

// Icon button
<Button size="icon" className="h-11 w-11">
  <Icon className="h-5 w-5" />
</Button>

// Link with padding
<a href="/page" className="inline-block py-3 px-4">
  Link text
</a>
```

### Touch Gestures

```tsx
// Swipeable cards (using library)
<SwipeableCard
  onSwipeLeft={handleDelete}
  onSwipeRight={handleApprove}
>
  <Card>Content</Card>
</SwipeableCard>

// Pull to refresh
<PullToRefresh onRefresh={handleRefresh}>
  <div>Content</div>
</PullToRefresh>
```

### Spacing for Touch

```tsx
// Adequate spacing between touch targets
<div className="flex flex-col gap-3">
  <Button>Button 1</Button>
  <Button>Button 2</Button>
  <Button>Button 3</Button>
</div>

// Adequate padding around touch areas
<button className="p-3 min-h-[44px]">
  Touch-friendly button
</button>
```

## Viewport-Specific Patterns

### Mobile (< 768px)

**Characteristics**:
- Single column layouts
- Full-width components
- Compact spacing
- Hamburger menus
- Card-based lists
- Bottom navigation (optional)

```tsx
<div className="md:hidden">
  {/* Mobile-only content */}
  <MobileNav />
  <div className="p-4">
    <div className="space-y-4">
      <Card className="w-full">Mobile card</Card>
    </div>
  </div>
</div>
```

### Tablet (768px - 1024px)

**Characteristics**:
- Two-column layouts
- Moderate spacing
- Sidebar navigation
- Grid-based lists
- Larger touch targets

```tsx
<div className="hidden md:block lg:hidden">
  {/* Tablet-only content */}
  <div className="grid grid-cols-2 gap-6 p-6">
    <Card>Tablet card</Card>
  </div>
</div>
```

### Desktop (> 1024px)

**Characteristics**:
- Multi-column layouts
- Generous spacing
- Fixed sidebars
- Table-based lists
- Hover interactions
- Keyboard shortcuts

```tsx
<div className="hidden lg:block">
  {/* Desktop-only content */}
  <div className="flex">
    <aside className="w-64">Sidebar</aside>
    <main className="flex-1 p-8">
      <div className="grid grid-cols-3 gap-8">
        <Card>Desktop card</Card>
      </div>
    </main>
  </div>
</div>
```

## Responsive Images

```tsx
// Responsive image sizes
<img
  src="/image.jpg"
  srcSet="/image-small.jpg 640w, /image-medium.jpg 1024w, /image-large.jpg 1920w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Description"
  className="w-full h-auto"
/>

// Next.js Image component
<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="w-full h-auto"
/>
```

## Testing Responsive Design

### Browser DevTools

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different devices and orientations
4. Check responsive breakpoints

### Real Devices

Test on actual devices:
- iPhone (iOS Safari)
- Android phone (Chrome)
- iPad (iOS Safari)
- Android tablet (Chrome)

### Responsive Testing Checklist

- [ ] All layouts work at all breakpoints
- [ ] Touch targets are at least 44x44px on mobile
- [ ] Text is readable (minimum 16px on mobile)
- [ ] Images scale appropriately
- [ ] Navigation works on all devices
- [ ] Forms are usable on mobile
- [ ] Tables are accessible on mobile (card view)
- [ ] Spacing is appropriate for each breakpoint
- [ ] No horizontal scrolling (except intentional)
- [ ] Content is accessible without zooming

## Common Patterns

### Dashboard Layout

```tsx
<div className="min-h-screen bg-background">
  {/* Mobile header */}
  <header className="lg:hidden border-b">
    <div className="flex items-center justify-between p-4">
      <Logo />
      <MobileMenuButton />
    </div>
  </header>
  
  {/* Desktop sidebar */}
  <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r">
    <Sidebar />
  </aside>
  
  {/* Main content */}
  <main className="lg:pl-64">
    <div className="container-page py-responsive-md">
      <PageHeader />
      <div className="space-responsive-lg">
        {/* Content sections */}
      </div>
    </div>
  </main>
</div>
```

### Form Layout

```tsx
<Card className="card-padding-default">
  <CardHeader>
    <CardTitle className="text-xl md:text-2xl">Form Title</CardTitle>
  </CardHeader>
  
  <CardContent>
    <form className="space-y-4">
      {/* Full width fields */}
      <div>
        <Label>Full Width Field</Label>
        <Input />
      </div>
      
      {/* Two column on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Field 1</Label>
          <Input />
        </div>
        <div>
          <Label>Field 2</Label>
          <Input />
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex flex-col-reverse md:flex-row justify-end gap-3">
        <Button variant="outline" className="w-full md:w-auto">
          Cancel
        </Button>
        <Button className="w-full md:w-auto">
          Submit
        </Button>
      </div>
    </form>
  </CardContent>
</Card>
```

### List/Table Layout

```tsx
<div>
  {/* Mobile: Cards */}
  <div className="md:hidden space-y-4">
    {items.map(item => (
      <LeaveCard key={item.id} leave={item} />
    ))}
  </div>
  
  {/* Desktop: Table */}
  <div className="hidden md:block">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.type}</TableCell>
            <TableCell>{item.dates}</TableCell>
            <TableCell><Badge>{item.status}</Badge></TableCell>
            <TableCell>
              <Button size="sm">View</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</div>
```

## Best Practices

### Do's ✅

- Start with mobile design first
- Use responsive utilities consistently
- Test on real devices
- Ensure touch targets are adequate
- Use semantic breakpoints
- Provide alternative layouts for mobile
- Optimize images for different sizes
- Test in both portrait and landscape

### Don'ts ❌

- Don't design desktop-first
- Don't use fixed pixel widths
- Don't make touch targets too small
- Don't hide important content on mobile
- Don't rely on hover states for mobile
- Don't forget to test on real devices
- Don't use too many breakpoints
- Don't ignore landscape orientation

## Resources

- [Design System](./DESIGN_SYSTEM.md)
- [Spacing Guide](./SPACING_GUIDE.md)
- [Component Library](./COMPONENT_LIBRARY.md)
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
