# Accessibility Quick Reference Guide

Quick reference for developers to ensure accessibility compliance when building features.

## Quick Checklist

When creating a new component or page, verify:

- [ ] All interactive elements are keyboard accessible
- [ ] All buttons have visible text or `aria-label`
- [ ] All form inputs have associated labels
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators are visible
- [ ] Semantic HTML is used
- [ ] ARIA attributes are added where needed

## Common Patterns

### Icon-Only Button
```tsx
// ✅ Good
<Button aria-label="Close dialog">
  <X className="h-4 w-4" aria-hidden="true" />
</Button>

// ❌ Bad
<Button>
  <X className="h-4 w-4" />
</Button>
```

### Form Field
```tsx
// ✅ Good
<FormItem>
  <FormLabel htmlFor="email">Email</FormLabel>
  <FormControl>
    <Input id="email" type="email" aria-required="true" />
  </FormControl>
  <FormMessage id="email-error" />
</FormItem>

// ❌ Bad
<Input placeholder="Email" />
```

### Navigation
```tsx
// ✅ Good
<nav aria-label="Main navigation">
  <Link href="/dashboard" aria-current={isActive ? 'page' : undefined}>
    Dashboard
  </Link>
</nav>

// ❌ Bad
<div>
  <a href="/dashboard">Dashboard</a>
</div>
```

### Loading State
```tsx
// ✅ Good
<div role="status" aria-label="Loading content">
  <Skeleton />
  <span className="sr-only">Loading...</span>
</div>

// ❌ Bad
<div>
  <Skeleton />
</div>
```

### List
```tsx
// ✅ Good
<div role="list" aria-label="Recent notifications">
  {items.map(item => (
    <div key={item.id} role="listitem">
      {item.content}
    </div>
  ))}
</div>

// ❌ Bad
<div>
  {items.map(item => (
    <div key={item.id}>{item.content}</div>
  ))}
</div>
```

### Modal/Dialog
```tsx
// ✅ Good
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent aria-labelledby="dialog-title" aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle id="dialog-title">Confirm Action</DialogTitle>
      <DialogDescription id="dialog-description">
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>

// ❌ Bad
<div className="modal">
  <h2>Confirm Action</h2>
  <p>Are you sure?</p>
</div>
```

### Card/Section
```tsx
// ✅ Good
<Card role="region" aria-labelledby="stats-title">
  <CardHeader>
    <CardTitle id="stats-title">Statistics</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// ❌ Bad
<Card>
  <CardHeader>
    <CardTitle>Statistics</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

## ARIA Attributes Reference

### Common ARIA Labels
- `aria-label`: Provides a label for an element
- `aria-labelledby`: References another element's ID for the label
- `aria-describedby`: References another element's ID for description
- `aria-hidden`: Hides element from screen readers
- `aria-live`: Announces dynamic content changes
- `aria-current`: Indicates current item in navigation
- `aria-expanded`: Indicates if element is expanded
- `aria-controls`: References element being controlled

### Form ARIA
- `aria-required`: Indicates required field
- `aria-invalid`: Indicates field has error
- `aria-describedby`: Links to error message

### Interactive ARIA
- `role="button"`: Makes element act as button
- `role="link"`: Makes element act as link
- `role="dialog"`: Indicates modal dialog
- `role="status"`: Announces status updates
- `role="alert"`: Announces important alerts

## Keyboard Navigation

### Standard Keys
- **Tab**: Move to next focusable element
- **Shift + Tab**: Move to previous focusable element
- **Enter**: Activate button or link
- **Space**: Activate button or toggle checkbox
- **Escape**: Close modal or dropdown
- **Arrow Keys**: Navigate within menus/dropdowns

### Implementation
```tsx
// Button activation
<button onClick={handleClick}>Submit</button>

// Custom keyboard handler
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Custom Button
</div>
```

## Color Contrast

### Minimum Ratios (WCAG AA)
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

### Testing
```tsx
import { checkColorContrast } from '@/lib/accessibility-utils'

const result = checkColorContrast('#000000', '#FFFFFF')
console.log(result.passesAA) // true
```

## Focus Management

### Visible Focus Indicators
All interactive elements automatically get focus indicators via global CSS. Don't override without providing an alternative.

```css
/* Already applied globally */
*:focus-visible {
  outline: none;
  ring: 2px solid var(--ring);
  ring-offset: 2px;
}
```

### Focus Trapping (Modals)
```tsx
import { trapFocus } from '@/lib/accessibility-utils'

useEffect(() => {
  if (isOpen && modalRef.current) {
    const cleanup = trapFocus(modalRef.current)
    return cleanup
  }
}, [isOpen])
```

## Screen Reader Utilities

### Hide Decorative Content
```tsx
<Icon aria-hidden="true" />
```

### Screen Reader Only Text
```tsx
<span className="sr-only">Additional context for screen readers</span>
```

### Announce Updates
```tsx
import { announceToScreenReader } from '@/lib/accessibility-utils'

announceToScreenReader('Form submitted successfully', 'polite')
```

## Semantic HTML

Use the right element for the job:

| Purpose | Element | Not |
|---------|---------|-----|
| Button | `<button>` | `<div onClick>` |
| Link | `<a href>` | `<div onClick>` |
| Navigation | `<nav>` | `<div>` |
| Main content | `<main>` | `<div>` |
| Sidebar | `<aside>` | `<div>` |
| Header | `<header>` | `<div>` |
| List | `<ul>/<ol>` | `<div>` |
| Form | `<form>` | `<div>` |

## Testing Commands

```bash
# Run accessibility unit tests
npm test -- lib/__tests__/accessibility.test.ts --run

# Run E2E accessibility tests
npm run test:e2e -- e2e/accessibility.spec.ts

# Run color contrast audit
npm run audit:accessibility
```

## Resources

- Full documentation: `frontend/docs/ACCESSIBILITY.md`
- Utilities: `frontend/lib/accessibility-utils.ts`
- Skip link component: `frontend/components/ui/skip-link.tsx`
- E2E tests: `frontend/e2e/accessibility.spec.ts`

## Common Mistakes to Avoid

1. ❌ Using `<div>` with `onClick` instead of `<button>`
2. ❌ Missing `alt` text on images
3. ❌ Form inputs without labels
4. ❌ Icon-only buttons without `aria-label`
5. ❌ Low color contrast
6. ❌ Removing focus indicators
7. ❌ Using color alone to convey information
8. ❌ Non-semantic HTML (divs for everything)
9. ❌ Missing skip links
10. ❌ Keyboard traps in modals

## Quick Wins

Easy accessibility improvements:

1. Add `aria-label` to icon-only buttons
2. Use semantic HTML elements
3. Add `alt` text to images
4. Ensure form labels are associated with inputs
5. Don't remove focus indicators
6. Use sufficient color contrast
7. Add skip links
8. Test with keyboard only
9. Run automated tests
10. Use the accessibility utilities provided

## Need Help?

- Check `frontend/docs/ACCESSIBILITY.md` for detailed guidance
- Run automated tests to catch issues early
- Use browser DevTools accessibility panel
- Test with keyboard navigation
- Use screen reader for testing

Remember: Accessibility is not optional - it's a requirement for all features!
