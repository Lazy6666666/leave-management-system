import { test as base, expect, Page, BrowserContext, APIRequestContext, TestType } from '@playwright/test';

// Define our custom fixtures type
export interface CustomFixtures {
  authenticatedPage: Page;
  managerPage: Page;
  request: APIRequestContext;
}

// Extend the base test with our custom fixtures
export const test = base.extend<CustomFixtures>({
  // Auto-login fixture for authenticated tests
  authenticatedPage: async ({ page, context }, use) => {
    // Clear any existing authentication state
    await context.clearCookies();
    
    // Navigate to login
    await page.goto('/login');

    // Fill in login form
    await page.fill('[data-testid="email"]', 'employee@company.com');
    await page.fill('[data-testid="password"]', 'password123');
    
    // Click login and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-button"]')
    ]);

    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');

    // Use the authenticated page
    await use(page);
  },

  // Manager login fixture
  managerPage: async ({ page, context }, use) => {
    // Clear any existing authentication state
    await context.clearCookies();
    
    // Navigate to login
    await page.goto('/login');

    // Fill in login form
    await page.fill('[data-testid="email"]', 'manager@company.com');
    await page.fill('[data-testid="password"]', 'password123');
    
    // Click login and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-button"]')
    ]);

    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');

    // Use the manager page
    await use(page);
  },
});

// Custom expect matchers
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PlaywrightTest {
    interface Matchers<R> {
      toBeAccessible(): Promise<R>;
    }
  }
}

expect.extend({
  async toBeAccessible(page: Page) {
    // @ts-ignore - AxeBuilder is dynamically imported
    const { default: AxeBuilder } = await import('@axe-core/playwright');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    const pass = accessibilityScanResults.violations.length === 0;

    if (pass) {
      return {
        message: () => 'Page is accessible',
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Page has accessibility violations:\n${accessibilityScanResults.violations
            .map((v: { id: string; description: string }) => `${v.id}: ${v.description}`)
            .join('\n')}`,
        pass: false,
      };
    }
  },
});

// Global test configuration
test.beforeEach(async ({ page }) => {
  // Set consistent viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  // Mock geolocation if needed
  await page.context().grantPermissions(['geolocation']);
});

test.afterEach(async ({ page }) => {
  // Clean up any test data or state
  await page.evaluate(() => {
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  });
});
