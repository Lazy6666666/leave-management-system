import { expect } from '@playwright/test';
import { test } from './test-utils';

// Define an interface for the performance metrics
interface PerformanceMetrics {
  largestContentfulPaint: number;
  firstInputDelay: number;
}

test.describe('Authentication Flow', () => {
  test('should complete full registration and login flow', async ({ page, authenticatedPage }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="fullName"]', 'Test User');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.selectOption('[data-testid="department"]', 'engineering');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Should redirect to dashboard or show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Test login with new account
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Should be logged in and redirected to dashboard
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should handle login validation errors', async ({ page }) => {
    await page.goto('/login');

    // Try to login without filling form
    await page.click('[data-testid="login-button"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

    // Try login with wrong credentials
    await page.fill('[data-testid="email"]', 'wrong@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Should show authentication error
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
  });
});

test.describe('Leave Request Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Login before each test
    await authenticatedPage.goto('/dashboard/leaves');
  });

  test('should create and submit leave request', async ({ authenticatedPage }) => {
    // Navigate to leave requests
    await authenticatedPage.click('[data-testid="new-request-button"]');

    // Fill leave request form
    await authenticatedPage.selectOption('[data-testid="leave-type"]', 'annual');
    await authenticatedPage.fill('[data-testid="start-date"]', '2024-02-01');
    await authenticatedPage.fill('[data-testid="end-date"]', '2024-02-05');
    await authenticatedPage.fill('[data-testid="reason"]', 'Family vacation to Europe');

    // Submit request
    await authenticatedPage.click('[data-testid="submit-request"]');

    // Should show success message
    await expect(authenticatedPage.locator('[data-testid="success-message"]')).toBeVisible();

    // Should show request in the list
    await expect(authenticatedPage.locator('[data-testid="leave-request-item"]')).toHaveCount(1);
    await expect(authenticatedPage.locator('[data-testid="leave-status"]')).toHaveText('pending');
  });

  test('should display leave balance correctly', async ({ authenticatedPage }) => {
    // Check leave balance cards
    await expect(authenticatedPage.locator('[data-testid="annual-balance"]')).toContainText('18 / 25');
    await expect(authenticatedPage.locator('[data-testid="sick-balance"]')).toContainText('8 / 10');
    await expect(authenticatedPage.locator('[data-testid="personal-balance"]')).toContainText('4 / 5');
  });

  test('should validate leave request dates', async ({ authenticatedPage }) => {
    await authenticatedPage.click('[data-testid="new-request-button"]');

    // Try to submit with end date before start date
    await authenticatedPage.selectOption('[data-testid="leave-type"]', 'annual');
    await authenticatedPage.fill('[data-testid="start-date"]', '2024-02-05');
    await authenticatedPage.fill('[data-testid="end-date"]', '2024-02-01');
    await authenticatedPage.fill('[data-testid="reason"]', 'Invalid dates');

    await authenticatedPage.click('[data-testid="submit-request"]');

    // Should show validation error
    await expect(authenticatedPage.locator('[data-testid="date-error"]')).toBeVisible();
  });
});

test.describe('Manager Approval Workflow', () => {
  test.beforeEach(async ({ managerPage }) => {
    // Login as manager
    await managerPage.goto('/dashboard/approvals');
  });

  test('should approve leave request', async ({ managerPage }) => {
    // Should see pending requests
    await expect(managerPage.locator('[data-testid="pending-request"]')).toHaveCount(1);

    // Click approve button
    await managerPage.click('[data-testid="approve-button"]');

    // Add approval comment
    await managerPage.fill('[data-testid="approval-comments"]', 'Approved for family time');

    // Confirm approval
    await managerPage.click('[data-testid="confirm-approve"]');

    // Should show success message
    await expect(managerPage.locator('[data-testid="approval-success"]')).toBeVisible();

    // Request should disappear from pending list
    await expect(managerPage.locator('[data-testid="pending-request"]')).toHaveCount(0);
  });

  test('should reject leave request with reason', async ({ managerPage }) => {
    // Click reject button
    await managerPage.click('[data-testid="reject-button"]');

    // Add rejection reason
    await managerPage.fill('[data-testid="rejection-comments"]', 'Insufficient coverage during this period');

    // Confirm rejection
    await managerPage.click('[data-testid="confirm-reject"]');

    // Should show success message
    await expect(managerPage.locator('[data-testid="rejection-success"]')).toBeVisible();
  });
});

test.describe('Document Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/documents');
  });

  test('should upload document successfully', async ({ authenticatedPage }) => {
    // Click upload button
    await authenticatedPage.click('[data-testid="upload-button"]');

    // Upload file
    await authenticatedPage.setInputFiles('[data-testid="file-input"]', {
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test file content'),
    });

    // Fill document details
    await authenticatedPage.fill('[data-testid="document-name"]', 'Test Document');
    await authenticatedPage.selectOption('[data-testid="document-type"]', 'policy');
    await authenticatedPage.fill('[data-testid="expiry-date"]', '2024-12-31');

    // Submit upload
    await authenticatedPage.click('[data-testid="submit-upload"]');

    // Should show success message
    await expect(authenticatedPage.locator('[data-testid="upload-success"]')).toBeVisible();

    // Document should appear in list
    await expect(authenticatedPage.locator('[data-testid="document-item"]')).toContainText('Test Document');
  });

  test('should show expiring documents alert', async ({ authenticatedPage }) => {
    // Should show expiring soon alert if there are expiring documents
    const expiringAlert = authenticatedPage.locator('[data-testid="expiring-alert"]');
    if (await expiringAlert.isVisible()) {
      await expect(expiringAlert).toContainText('expiring soon');
    }
  });
});

test.describe('Accessibility Tests', () => {
  test('should pass accessibility audit on main pages', async ({ page, authenticatedPage }) => {
    // Test home page accessibility
    await page.goto('/');
    await expect(page).toBeAccessible();

    // Test login page accessibility
    await page.goto('/login');
    await expect(page).toBeAccessible();

    // Test dashboard accessibility (after login)
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage).toBeAccessible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-button"]')).toBeFocused();

    // Submit form with keyboard
    await page.keyboard.press('Enter');

    // Should attempt login
    await expect(page.locator('[data-testid="auth-error"], [data-testid="dashboard"]')).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('should load pages within performance budget', async ({ page }) => {
    // Measure home page load time
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);

    // Check Core Web Vitals
    const metrics: PerformanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let largestContentfulPaint = 0;
        let firstInputDelay = 0;

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              largestContentfulPaint = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              const eventTiming = entry as any; // Cast to any to access processingStart
              firstInputDelay = eventTiming.processingStart - eventTiming.startTime;
            }
          }
        }).observe({ entryTypes: ['first-input'] });

        setTimeout(() => {
          resolve({ largestContentfulPaint, firstInputDelay });
        }, 3000);
      });
    });

    // LCP should be under 2.5 seconds
    expect(metrics.largestContentfulPaint).toBeLessThan(2500);

    // FID should be under 100ms
    expect(metrics.firstInputDelay).toBeLessThan(100);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');

    // Form should be usable on mobile
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    await expect(page.locator('[data-testid="password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();

    // Should be able to interact with form
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
  });

  test('should work on tablet viewport', async ({ page, authenticatedPage }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await authenticatedPage.goto('/dashboard');

    // Sidebar should be collapsible on tablet
    await expect(authenticatedPage.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="main-content"]')).toBeVisible();
  });
});
