# Testing Guide - Leave Management System

Quick reference guide for developers working with the test suite.

---

## Quick Start 🚀

### Run All Tests
```bash
# Run comprehensive test suite
npm run test:coverage      # Unit tests with coverage
npm run test:e2e           # E2E tests
npm run test:a11y:all      # Accessibility tests
```

### Development Workflow
```bash
# Watch mode for TDD
npm test                   # Unit tests in watch mode

# Before committing
npm run test:run           # Run tests once
npm run lint               # Check code style
npm run type-check         # TypeScript validation
```

---

## Test Structure 📁

```
frontend/
├── e2e/                           # E2E tests (Playwright)
│   ├── fixtures/                  # Test data and users
│   ├── utils/                     # Test helpers
│   ├── auth.setup.ts              # Auth state setup
│   ├── auth.spec.ts               # Auth tests
│   ├── leave-requests.spec.ts     # Leave workflow tests
│   ├── approvals.spec.ts          # Approval tests
│   ├── documents.spec.ts          # Document tests
│   └── admin.spec.ts              # Admin tests
│
├── __tests__/                     # Unit & component tests
│   ├── hooks/                     # Hook tests
│   ├── components/                # Component tests
│   └── api/                       # API route tests
│
├── playwright.config.ts           # Playwright config
├── vitest.config.ts               # Vitest config
└── TEST_SUITE_SUMMARY.md          # Detailed test documentation
```

---

## Writing Tests ✍️

### Unit Test Template
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

describe('MyHook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', async () => {
    const { result } = renderHook(() => useMyHook())

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
  })
})
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test'
import { getTestUser } from './fixtures/test-users'
import { login } from './utils/auth-helpers'

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, getTestUser('employee'))
  })

  test('should work correctly', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('h1')).toBeVisible()
  })
})
```

### Component Test Template
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle clicks', () => {
    const onClick = vi.fn()
    render(<MyComponent onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

---

## Best Practices ⭐

### General
- ✅ **Descriptive names**: `should update user when valid data is provided`
- ✅ **AAA pattern**: Arrange, Act, Assert
- ✅ **Test behavior, not implementation**: Focus on user-facing behavior
- ✅ **One assertion per test**: Keep tests focused
- ✅ **Clean up**: Use `beforeEach` and `afterEach` properly

### E2E Tests
- ✅ **Use test helpers**: Reuse functions from `e2e/utils/`
- ✅ **Wait for elements**: Always use `waitFor` or `expect().toBeVisible()`
- ✅ **Test user flows**: Follow real user journeys
- ✅ **Test error states**: Don't just test happy paths
- ✅ **Check accessibility**: Use `checkA11y()` helper

### Unit Tests
- ✅ **Mock external dependencies**: Mock Supabase, fetch, etc.
- ✅ **Test edge cases**: Null, undefined, empty arrays
- ✅ **Test error handling**: Verify error messages and states
- ✅ **Use React Query wrapper**: Wrap hooks in QueryClientProvider

---

## Common Patterns 🔧

### Mocking Supabase
```typescript
const mockFrom = vi.fn()
vi.mock('@/lib/supabase-client', () => ({
  getBrowserClient: () => ({
    from: mockFrom,
    auth: { getUser: vi.fn() },
  }),
}))
```

### Testing Async Hooks
```typescript
const { result } = renderHook(() => useMyHook(), { wrapper })

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true)
})

expect(result.current.data).toEqual(expectedData)
```

### Testing Form Submission
```typescript
await fillFormField(page, 'Email', 'test@example.com')
await clickButton(page, 'Submit')
await waitForToast(page, 'Success')
```

### Testing Protected Routes
```typescript
test('should redirect unauthenticated users', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/login')
})
```

---

## Debugging Tests 🐛

### Unit Tests
```bash
# Run specific test file
npm test -- use-org-stats.test.ts

# Run with UI
npm run test:ui

# Debug in VS Code
# Add breakpoint, then F5 (with Vitest extension)
```

### E2E Tests
```bash
# Debug mode (opens browser)
npm run test:e2e:debug

# Run specific test
npx playwright test auth.spec.ts

# Visual mode
npm run test:e2e:ui

# View last run report
npm run test:visual:report
```

### Common Issues
- **Timeout errors**: Increase timeout in test or config
- **Element not found**: Add `waitFor` or check selector
- **Flaky tests**: Add proper waits, avoid race conditions
- **Mock not working**: Check mock is set up before test runs

---

## Coverage Reports 📊

### Generate Coverage
```bash
npm run test:coverage
```

### View Reports
```bash
# HTML report
open coverage/index.html

# Terminal summary
npm run test:run -- --coverage
```

### Interpreting Coverage
- **Lines**: % of code lines executed
- **Functions**: % of functions called
- **Branches**: % of if/else paths taken
- **Statements**: % of statements executed

**Targets**:
- Lines: ≥95%
- Functions: ≥95%
- Statements: ≥95%
- Branches: ≥90%

---

## CI/CD Integration 🔄

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Accessibility Testing ♿

### Run A11y Tests
```bash
npm run test:a11y              # Basic tests
npm run test:a11y:enhanced     # Enhanced tests
npm run test:a11y:keyboard     # Keyboard navigation
npm run test:a11y:all          # All a11y tests
```

### A11y Best Practices
- ✅ Test with keyboard only (Tab, Enter, Escape)
- ✅ Verify ARIA labels and roles
- ✅ Check color contrast
- ✅ Test with screen reader announcements
- ✅ Validate form labels and error messages

---

## Performance Testing 🚄

### Lighthouse CI
```bash
# Install
npm install -g @lhci/cli

# Run
lhci autorun --collect.url=http://localhost:3000
```

### Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 10 --num 100 http://localhost:3000/api/leaves
```

---

## Test Data Management 📦

### Test Users
Located in `e2e/fixtures/test-users.ts`:
- `employee`: Regular employee
- `manager`: Department manager
- `hr`: HR personnel
- `admin`: System administrator

### Creating Test Data
```typescript
// In test setup
const testLeave = {
  leave_type_id: '1',
  start_date: '2025-12-01',
  end_date: '2025-12-05',
  reason: 'Test leave',
}
```

### Cleaning Up Test Data
```typescript
afterEach(async () => {
  // Clean up test data
  await supabase.from('leaves').delete().eq('reason', 'Test leave')
})
```

---

## Troubleshooting 🔍

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Stale Test Cache
```bash
# Clear Vitest cache
rm -rf node_modules/.vitest

# Clear Playwright cache
npx playwright install --force
```

### Type Errors in Tests
```bash
# Regenerate types
npm run type-check

# Update test tsconfig
# Check e2e/tsconfig.json includes all necessary types
```

---

## Resources 📚

### Documentation
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [React Query Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)

### Guides
- `TEST_SUITE_SUMMARY.md`: Comprehensive test documentation
- `CLAUDE.md`: Project overview and patterns

---

## Getting Help 🆘

### Common Commands
```bash
# Help
npm run test -- --help
npx playwright test --help

# List all tests
npm run test -- --list
npx playwright test --list

# Run single test
npm test -- --grep "specific test name"
npx playwright test --grep "specific test"
```

### Support
- Check `TEST_SUITE_SUMMARY.md` for detailed information
- Review existing tests for patterns
- Consult framework documentation
- Ask in team chat or code review

---

**Happy Testing! 🎉**
