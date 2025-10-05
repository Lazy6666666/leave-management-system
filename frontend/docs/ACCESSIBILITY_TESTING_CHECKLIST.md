# Accessibility Testing Checklist

Comprehensive checklist for testing WCAG 2.1 Level AA compliance in the Leave Management System.

## Requirements Coverage

- **Requirement 10.1**: WCAG 2.1 Level AA compliance
- **Requirement 10.2**: Keyboard navigation
- **Requirement 10.3**: Screen reader compatibility  
- **Requirement 10.4**: Focus management

## Quick Reference

### Testing Priority

1. **Critical** (🔴) - Must fix before release
2. **High** (🟠) - Should fix before release
3. **Medium** (🟡) - Fix in next iteration
4. **Low** (🟢) - Nice to have

## 1. Perceivable

### 1.1 Text Alternatives (Level A)

- [ ] 🔴 All images have alt text or are marked decorative
- [ ] 🔴 Icon-only buttons have aria-label
- [ ] 🔴 Form inputs have associated labels
- [ ] 🟠 Complex images have detailed descriptions
- [ ] 🟠 Charts and graphs have text alternatives

**Test Method:**
```bash
# Automated
npm run test:e2e -- accessibility

# Manual
- Inspect each image for alt attribute
- Check icon buttons for aria-label
- Verify form labels are associated
```

### 1.2 Time-based Media (Level A)

- [ ] 🟡 Videos have captions (if applicable)
- [ ] 🟡 Audio content has transcripts (if applicable)

**Note:** Currently no time-based media in application

### 1.3 Adaptable (Level A)

- [ ] 🔴 Content structure uses semantic HTML
- [ ] 🔴 Heading hierarchy is logical (no skipped levels)
- [ ] 🔴 Lists use proper list markup
- [ ] 🔴 Tables have proper structure (thead, tbody, th)
- [ ] 🟠 Form fields have programmatic labels
- [ ] 🟠 Reading order is logical

**Test Method:**
```bash
# Check heading structure
npm run test:e2e -- accessibility-enhanced -g "heading structure"

# Manual
- Use browser dev tools to inspect HTML structure
- Navigate with screen reader
- Check tab order
```

### 1.4 Distinguishable (Level AA)

- [ ] 🔴 Text has 4.5:1 contrast ratio (normal text)
- [ ] 🔴 Large text has 3:1 contrast ratio
- [ ] 🔴 UI components have 3:1 contrast ratio
- [ ] 🔴 Focus indicators have 3:1 contrast ratio
- [ ] 🟠 Text can be resized to 200% without loss of content
- [ ] 🟠 Images of text are avoided (use actual text)
- [ ] 🟡 Color is not the only means of conveying information

**Test Method:**
```bash
# Automated contrast check
npm run test:e2e -- accessibility -g "Color Contrast"

# Manual
- Use browser zoom to 200%
- Check focus indicators are visible
- Verify status indicators have text labels
```

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Browser DevTools Accessibility Panel

## 2. Operable

### 2.1 Keyboard Accessible (Level A)

- [ ] 🔴 All functionality available via keyboard
- [ ] 🔴 No keyboard traps (can navigate away from all elements)
- [ ] 🔴 Skip links are provided
- [ ] 🟠 Keyboard shortcuts don't conflict with screen readers
- [ ] 🟠 Tab order is logical

**Test Method:**
```bash
# Automated
npm run test:e2e -- keyboard-navigation

# Manual
- Unplug mouse
- Navigate entire application with keyboard only
- Test all interactive elements
```

**Key Tests:**
- Tab through all pages
- Test forms with keyboard only
- Open and close dialogs with keyboard
- Navigate menus with keyboard
- Test skip links

### 2.2 Enough Time (Level A)

- [ ] 🟠 No time limits on interactions (or adjustable)
- [ ] 🟠 Auto-updating content can be paused
- [ ] 🟡 Session timeouts have warnings

**Test Method:**
- Check for any timed interactions
- Verify timeout warnings appear
- Test pause/stop controls

### 2.3 Seizures and Physical Reactions (Level A)

- [ ] 🔴 No content flashes more than 3 times per second
- [ ] 🟠 Animations can be disabled

**Test Method:**
- Review all animations
- Check for flashing content
- Test with prefers-reduced-motion

### 2.4 Navigable (Level AA)

- [ ] 🔴 Skip links bypass repeated content
- [ ] 🔴 Page titles are descriptive and unique
- [ ] 🔴 Focus order is logical
- [ ] 🔴 Link purpose is clear from link text
- [ ] 🔴 Multiple ways to find pages (nav, search, sitemap)
- [ ] 🟠 Headings and labels are descriptive
- [ ] 🟠 Focus is visible

**Test Method:**
```bash
# Automated
npm run test:e2e -- accessibility-enhanced -g "Navigation"

# Manual
- Test skip links
- Check page titles
- Verify focus indicators
- Review all link text
```

### 2.5 Input Modalities (Level A)

- [ ] 🔴 Touch targets are at least 44x44px
- [ ] 🟠 Pointer gestures have keyboard alternatives
- [ ] 🟠 Accidental activation is prevented

**Test Method:**
```bash
# Automated
npm run test:e2e -- accessibility-enhanced -g "touch targets"

# Manual
- Test on mobile device
- Verify button sizes
- Check for accidental clicks
```

## 3. Understandable

### 3.1 Readable (Level A)

- [ ] 🔴 Page language is identified (lang attribute)
- [ ] 🟠 Language changes are marked
- [ ] 🟡 Unusual words are defined

**Test Method:**
```html
<!-- Check HTML tag -->
<html lang="en">
```

### 3.2 Predictable (Level A)

- [ ] 🔴 Focus doesn't cause unexpected context changes
- [ ] 🔴 Input doesn't cause unexpected context changes
- [ ] 🟠 Navigation is consistent across pages
- [ ] 🟠 Components are identified consistently

**Test Method:**
- Tab through pages and verify no unexpected changes
- Fill out forms and check for unexpected behavior
- Compare navigation across pages

### 3.3 Input Assistance (Level AA)

- [ ] 🔴 Form errors are identified and described
- [ ] 🔴 Labels and instructions are provided
- [ ] 🔴 Error suggestions are provided
- [ ] 🟠 Error prevention for important actions (confirmations)
- [ ] 🟠 Required fields are indicated

**Test Method:**
```bash
# Automated
npm run test:e2e -- accessibility -g "Form"

# Manual
- Submit forms with errors
- Check error messages
- Verify required field indicators
- Test confirmation dialogs
```

## 4. Robust

### 4.1 Compatible (Level A)

- [ ] 🔴 HTML is valid (no parsing errors)
- [ ] 🔴 Elements have complete start and end tags
- [ ] 🔴 Elements are nested correctly
- [ ] 🔴 IDs are unique
- [ ] 🔴 ARIA attributes are valid
- [ ] 🟠 Status messages use appropriate roles

**Test Method:**
```bash
# Automated
npm run test:e2e -- accessibility

# Manual
- Validate HTML with W3C validator
- Check ARIA usage
- Verify unique IDs
```

**Tools:**
- [W3C HTML Validator](https://validator.w3.org/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)

## Page-Specific Checklists

### Login Page

- [ ] Email field has label
- [ ] Password field has label and is identified as password
- [ ] Submit button has descriptive text
- [ ] Error messages are announced
- [ ] Skip link is present
- [ ] Focus order is logical
- [ ] All elements keyboard accessible

### Dashboard

- [ ] Page title is descriptive
- [ ] Stat cards have accessible labels
- [ ] Navigation is keyboard accessible
- [ ] Skip link works
- [ ] Headings are hierarchical
- [ ] All interactive elements focusable
- [ ] Focus indicators visible

### Leave Request Form

- [ ] All fields have labels
- [ ] Required fields are indicated
- [ ] Date picker is keyboard accessible
- [ ] Validation errors are announced
- [ ] Submit button is clearly labeled
- [ ] Success/error feedback is announced
- [ ] Dialog can be closed with Escape

### Leave Request List

- [ ] Table has caption or aria-label
- [ ] Column headers are properly marked
- [ ] Status badges have text labels
- [ ] Action buttons are labeled
- [ ] Empty state is announced
- [ ] Pagination is keyboard accessible
- [ ] Mobile card view is accessible

### Admin Dashboard

- [ ] Admin-specific content is clear
- [ ] User management table is accessible
- [ ] Bulk actions are keyboard accessible
- [ ] Confirmation dialogs are accessible
- [ ] All admin functions keyboard accessible

## Testing Tools

### Automated Testing

```bash
# Run all accessibility tests
npm run test:e2e -- accessibility

# Run enhanced accessibility tests
npm run test:e2e -- accessibility-enhanced

# Run keyboard navigation tests
npm run test:e2e -- keyboard-navigation

# Run specific test group
npm run test:e2e -- accessibility -g "ARIA"
```

### Browser Extensions

1. **axe DevTools** - Automated accessibility testing
2. **WAVE** - Visual accessibility evaluation
3. **Lighthouse** - Accessibility audit
4. **HeadingsMap** - Heading structure visualization
5. **Accessibility Insights** - Comprehensive testing

### Screen Readers

1. **NVDA** (Windows) - Free
2. **JAWS** (Windows) - Commercial
3. **VoiceOver** (macOS) - Built-in

### Manual Testing Tools

1. **Keyboard Only** - Unplug mouse
2. **Browser Zoom** - Test at 200%
3. **Color Blindness Simulator** - Check color contrast
4. **DevTools Accessibility Panel** - Inspect accessibility tree

## Testing Workflow

### 1. Automated Tests (5 minutes)

```bash
npm run test:e2e -- accessibility
npm run test:e2e -- accessibility-enhanced
npm run test:e2e -- keyboard-navigation
```

Review results and fix critical issues.

### 2. Keyboard Testing (15 minutes)

- Unplug mouse
- Navigate through all pages
- Test all interactive elements
- Verify focus indicators
- Check tab order

### 3. Screen Reader Testing (30 minutes)

- Test with NVDA or VoiceOver
- Navigate through all pages
- Test forms and interactions
- Verify announcements
- Check dynamic content

### 4. Visual Testing (10 minutes)

- Check color contrast
- Verify focus indicators
- Test at 200% zoom
- Check responsive design
- Verify status indicators

### 5. Documentation (10 minutes)

- Document issues found
- Prioritize fixes
- Create tickets
- Update checklist

## Issue Tracking Template

```markdown
### Issue: [Brief Description]

**Priority:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

**WCAG Criterion:** [e.g., 1.4.3 Contrast (Minimum)]

**Page/Component:** [e.g., Login Page, Leave Request Form]

**Description:**
[Detailed description of the issue]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Impact:**
[Who is affected and how]

**Suggested Fix:**
[Proposed solution]

**Testing Method:**
[How to verify the fix]
```

## Compliance Summary

### WCAG 2.1 Level A

- [ ] All Level A criteria met
- [ ] No critical issues remaining
- [ ] Automated tests pass

### WCAG 2.1 Level AA

- [ ] All Level AA criteria met
- [ ] Color contrast meets requirements
- [ ] Focus indicators visible
- [ ] Form validation accessible

### Additional Best Practices

- [ ] Skip links implemented
- [ ] Semantic HTML used throughout
- [ ] ARIA used appropriately
- [ ] Keyboard navigation optimized
- [ ] Screen reader tested
- [ ] Mobile accessibility verified

## Sign-off

**Tested By:** _______________  
**Date:** _______________  
**Screen Readers Used:** _______________  
**Browsers Tested:** _______________  

**Compliance Status:**
- [ ] WCAG 2.1 Level A Compliant
- [ ] WCAG 2.1 Level AA Compliant
- [ ] Ready for Release

**Outstanding Issues:** _______________

**Notes:** _______________
