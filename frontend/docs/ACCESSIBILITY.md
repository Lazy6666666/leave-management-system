# Accessibility Compliance Documentation

This document outlines the accessibility features and compliance measures implemented in the Leave Management System.

## Overview

The Leave Management System is designed to meet WCAG 2.1 AA standards, ensuring that all users, regardless of their abilities, can effectively use the application.

## Accessibility Features Implemented

### 1. Skip Links

**Location**: `frontend/components/ui/skip-link.tsx`, `frontend/pages/_app.tsx`

Skip links allow keyboard users to bypass repetitive navigation and jump directly to main content.

- **Skip to main content**: Jumps to the main content area
- **Skip to navigation**: Jumps to the navigation menu

**Usage**:
```tsx
<SkipLink href="#main-content">Skip to main content</SkipLink>
```

**Testing**: Press Tab when the page loads - the skip link should become visible.

### 2. Keyboard Navigation

All interactive elements are keyboard accessible:

- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dropdowns
- **Arrow keys**: Navigate within menus and dropdowns

**Focus Indicators**: All focusable elements have visible focus indicators that meet WCAG 2.1 AA standards (2px ring with offset).

### 3. ARIA Labels and Landmarks

#### Landmarks
- `<main>` with `role="main"` and `aria-label="Main content"`
- `<nav>` with `aria-label="Main navigation"` or `aria-label="Mobile navigation"`
- `<header>` for page headers
- `<aside>` with `aria-label="Dashboard sidebar"`

#### ARIA Labels
All icon-only buttons and interactive elements have proper ARIA labels:

```tsx
<Button aria-label="View notifications">
  <Bell className="h-5 w-5" />
</Button>
```

#### ARIA Live Regions
Dynamic content updates are announced to screen readers:

- Toast notifications use `aria-live="polite"` or `aria-live="assertive"`
- Loading states use `role="status"` with `aria-label`

### 4. Form Accessibility

All forms follow accessibility best practices:

#### Labels
Every form field has an associated label:
```tsx
<FormLabel htmlFor="email">Email</FormLabel>
<FormControl>
  <Input id="email" type="email" />
</FormControl>
```

#### Required Fields
Required fields are indicated both visually and programmatically:
```tsx
<Input required aria-required="true" />
```

#### Error Messages
Error messages are associated with their fields:
```tsx
<Input
  aria-invalid="true"
  aria-describedby="email-error"
/>
<FormMessage id="email-error">
  Please enter a valid email
</FormMessage>
```

### 5. Color Contrast

All color combinations meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text).

#### Light Mode Contrast Ratios
- Body text (foreground on background): 21:1 ✓
- Primary button (primary-foreground on primary): 7.2:1 ✓
- Muted text (muted-foreground on background): 4.6:1 ✓
- Success badge (success-foreground on success): 8.1:1 ✓
- Warning badge (warning-foreground on warning): 6.3:1 ✓
- Destructive badge (destructive-foreground on destructive): 7.5:1 ✓

#### Dark Mode Contrast Ratios
All color combinations in dark mode also meet WCAG AA standards.

**Testing**: Run the accessibility audit script:
```bash
npm run audit:accessibility
```

### 6. Focus Management

#### Focus Indicators
Enhanced focus indicators are applied globally:

```css
*:focus-visible {
  outline: none;
  ring: 2px solid var(--ring);
  ring-offset: 2px;
}
```

#### Focus Trapping
Modals and dialogs trap focus within their boundaries:

```tsx
import { trapFocus } from '@/lib/accessibility-utils'

useEffect(() => {
  if (isOpen) {
    const cleanup = trapFocus(modalRef.current)
    return cleanup
  }
}, [isOpen])
```

### 7. Screen Reader Support

#### Screen Reader Only Text
Important information for screen readers is provided using the `.sr-only` class:

```tsx
<Button>
  <Icon />
  <span className="sr-only">Close dialog</span>
</Button>
```

#### Decorative Elements
Decorative icons are hidden from screen readers:

```tsx
<Icon aria-hidden="true" />
```

#### Dynamic Announcements
Important updates are announced to screen readers:

```tsx
import { announceToScreenReader } from '@/lib/accessibility-utils'

announceToScreenReader('Leave request submitted successfully', 'polite')
```

### 8. Semantic HTML

The application uses semantic HTML elements:

- `<header>` for page headers
- `<nav>` for navigation
- `<main>` for main content
- `<aside>` for sidebars
- `<article>` for self-contained content
- `<section>` for thematic grouping
- `<button>` for buttons (not divs with click handlers)
- `<a>` for links with proper `href` attributes

### 9. Responsive Design

The application is fully responsive and accessible on all devices:

- Touch targets are at least 44x44px on mobile
- Text is readable without zooming
- Content reflows properly at different viewport sizes
- No horizontal scrolling required

### 10. Loading States

Loading states are properly announced:

```tsx
<div role="status" aria-label="Loading content">
  <Skeleton />
</div>
```

## Testing Accessibility

### Automated Testing

#### Unit Tests
Run accessibility utility tests:
```bash
npm test -- lib/__tests__/accessibility.test.ts --run
```

#### E2E Tests with axe-core
Run comprehensive accessibility tests:
```bash
npm run test:e2e -- e2e/accessibility.spec.ts
```

These tests check for:
- WCAG 2.1 AA compliance
- Color contrast issues
- Missing ARIA labels
- Keyboard navigation
- Form accessibility
- Screen reader support

### Manual Testing

#### Keyboard Navigation Checklist
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test skip links
- [ ] Verify modal focus trapping
- [ ] Test dropdown navigation with arrow keys
- [ ] Verify Escape closes modals

#### Screen Reader Testing
Test with multiple screen readers:
- **Windows**: NVDA (free) or JAWS
- **macOS**: VoiceOver (built-in)
- **iOS**: VoiceOver (built-in)
- **Android**: TalkBack (built-in)

#### Color Contrast Testing
Use browser extensions:
- axe DevTools
- WAVE
- Lighthouse (Chrome DevTools)

#### Zoom Testing
- Test at 200% zoom
- Verify no content is cut off
- Verify no horizontal scrolling

## Accessibility Utilities

### Available Utilities

#### `checkColorContrast(foreground, background)`
Checks if color combination meets WCAG standards.

```tsx
const result = checkColorContrast('#000000', '#FFFFFF')
// { ratio: 21, passesAA: true, passesAAA: true }
```

#### `announceToScreenReader(message, priority)`
Announces a message to screen readers.

```tsx
announceToScreenReader('Form submitted successfully', 'polite')
```

#### `trapFocus(container)`
Traps focus within a container (for modals).

```tsx
const cleanup = trapFocus(modalElement)
// Call cleanup() when modal closes
```

#### `validateFieldAccessibility(field)`
Validates form field accessibility.

```tsx
const result = validateFieldAccessibility(inputElement)
// { isValid: true, issues: [] }
```

## Common Accessibility Issues and Solutions

### Issue: Icon-only button without label
**Problem**: Screen readers can't identify the button's purpose.

**Solution**:
```tsx
// ❌ Bad
<Button><Icon /></Button>

// ✓ Good
<Button aria-label="Close dialog">
  <Icon aria-hidden="true" />
</Button>
```

### Issue: Form field without label
**Problem**: Users don't know what to enter.

**Solution**:
```tsx
// ❌ Bad
<Input placeholder="Email" />

// ✓ Good
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

### Issue: Low color contrast
**Problem**: Text is hard to read.

**Solution**: Use the color contrast checker utility and adjust colors to meet WCAG AA standards (4.5:1 for normal text).

### Issue: Missing focus indicator
**Problem**: Keyboard users can't see where they are.

**Solution**: Ensure all interactive elements have visible focus indicators. The global CSS already handles this, but custom components should not override it.

### Issue: Div used as button
**Problem**: Not keyboard accessible, no semantic meaning.

**Solution**:
```tsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✓ Good
<button onClick={handleClick}>Click me</button>
```

## WCAG 2.1 AA Compliance Checklist

### Perceivable
- [x] 1.1.1 Non-text Content (Level A)
- [x] 1.3.1 Info and Relationships (Level A)
- [x] 1.3.2 Meaningful Sequence (Level A)
- [x] 1.3.3 Sensory Characteristics (Level A)
- [x] 1.4.1 Use of Color (Level A)
- [x] 1.4.3 Contrast (Minimum) (Level AA)
- [x] 1.4.4 Resize Text (Level AA)
- [x] 1.4.5 Images of Text (Level AA)
- [x] 1.4.10 Reflow (Level AA)
- [x] 1.4.11 Non-text Contrast (Level AA)
- [x] 1.4.12 Text Spacing (Level AA)
- [x] 1.4.13 Content on Hover or Focus (Level AA)

### Operable
- [x] 2.1.1 Keyboard (Level A)
- [x] 2.1.2 No Keyboard Trap (Level A)
- [x] 2.1.4 Character Key Shortcuts (Level A)
- [x] 2.4.1 Bypass Blocks (Level A) - Skip links
- [x] 2.4.2 Page Titled (Level A)
- [x] 2.4.3 Focus Order (Level A)
- [x] 2.4.4 Link Purpose (In Context) (Level A)
- [x] 2.4.5 Multiple Ways (Level AA)
- [x] 2.4.6 Headings and Labels (Level AA)
- [x] 2.4.7 Focus Visible (Level AA)
- [x] 2.5.1 Pointer Gestures (Level A)
- [x] 2.5.2 Pointer Cancellation (Level A)
- [x] 2.5.3 Label in Name (Level A)
- [x] 2.5.4 Motion Actuation (Level A)

### Understandable
- [x] 3.1.1 Language of Page (Level A)
- [x] 3.2.1 On Focus (Level A)
- [x] 3.2.2 On Input (Level A)
- [x] 3.2.3 Consistent Navigation (Level AA)
- [x] 3.2.4 Consistent Identification (Level AA)
- [x] 3.3.1 Error Identification (Level A)
- [x] 3.3.2 Labels or Instructions (Level A)
- [x] 3.3.3 Error Suggestion (Level AA)
- [x] 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)

### Robust
- [x] 4.1.1 Parsing (Level A)
- [x] 4.1.2 Name, Role, Value (Level A)
- [x] 4.1.3 Status Messages (Level AA)

## Resources

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension for accessibility testing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome DevTools
- [NVDA](https://www.nvaccess.org/) - Free screen reader for Windows

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

### Testing
- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Testing Guide](https://webaim.org/articles/keyboard/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Maintenance

### Regular Audits
Run accessibility audits regularly:
```bash
# Run automated tests
npm run test:e2e -- e2e/accessibility.spec.ts

# Run color contrast audit
npm run audit:accessibility
```

### Code Review Checklist
When reviewing code, check for:
- [ ] All interactive elements are keyboard accessible
- [ ] All images have alt text
- [ ] All form fields have labels
- [ ] Color contrast meets WCAG AA
- [ ] ARIA labels are present where needed
- [ ] Focus indicators are visible
- [ ] Semantic HTML is used

### Continuous Improvement
- Monitor user feedback for accessibility issues
- Stay updated with WCAG guidelines
- Test with real users who use assistive technologies
- Regularly update dependencies for accessibility fixes

## Contact

For accessibility concerns or questions, please contact the development team or file an issue in the project repository.
