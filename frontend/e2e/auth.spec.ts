/**
 * Authentication E2E Tests
 *
 * Tests for login, logout, registration, session persistence, and role-based access
 */

import { test, expect } from '@playwright/test'
import { TEST_USERS, getTestUser } from './fixtures/test-users'
import { login, logout, expectAuthenticated, expectUnauthenticated, clearAuth } from './utils/auth-helpers'
import { waitForToast } from './utils/test-helpers'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page)
  })

  test.describe('Login', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      const user = getTestUser('employee')

      await page.goto('/login')
      await page.fill('input[name="email"]', user.email)
      await page.fill('input[name="password"]', user.password)
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('text=' + user.name)).toBeVisible()
    })

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[name="email"]', 'invalid@test.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')

      await waitForToast(page, 'Invalid')
      await expect(page).toHaveURL('/login')
    })

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login')
      await page.click('button[type="submit"]')

      await expect(page.locator('text=Email is required')).toBeVisible()
      await expect(page.locator('text=Password is required')).toBeVisible()
    })

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[name="email"]', 'notanemail')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')

      await expect(page.locator('text=Invalid email')).toBeVisible()
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login')

      const passwordInput = page.locator('input[name="password"]')
      const toggleButton = page.locator('button[aria-label*="password"]')

      await expect(passwordInput).toHaveAttribute('type', 'password')

      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')

      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should redirect authenticated users away from login', async ({ page }) => {
      const user = getTestUser('employee')
      await login(page, user)

      await page.goto('/login')
      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      const user = getTestUser('employee')
      await login(page, user)

      await logout(page)
      await expectUnauthenticated(page)
    })

    test('should clear session data on logout', async ({ page }) => {
      const user = getTestUser('employee')
      await login(page, user)
      await logout(page)

      await page.goto('/dashboard')
      await expectUnauthenticated(page)
    })
  })

  test.describe('Registration', () => {
    test('should show registration form', async ({ page }) => {
      await page.goto('/register')

      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('input[name="full_name"]')).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/register')
      await page.click('button[type="submit"]')

      await expect(page.locator('text=Email is required')).toBeVisible()
      await expect(page.locator('text=Password is required')).toBeVisible()
      await expect(page.locator('text=Full name is required')).toBeVisible()
    })

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register')

      await page.fill('input[name="email"]', 'newuser@test.com')
      await page.fill('input[name="password"]', 'weak')
      await page.fill('input[name="full_name"]', 'New User')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=Password must be at least')).toBeVisible()
    })

    test('should navigate to login from registration', async ({ page }) => {
      await page.goto('/register')
      await page.click('text=Already have an account?')

      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Session Persistence', () => {
    test('should persist session across page refreshes', async ({ page }) => {
      const user = getTestUser('employee')
      await login(page, user)

      await page.reload()
      await expectAuthenticated(page)
      await expect(page.locator('text=' + user.name)).toBeVisible()
    })

    test('should persist session across navigation', async ({ page }) => {
      const user = getTestUser('employee')
      await login(page, user)

      await page.goto('/dashboard/profile')
      await expectAuthenticated(page)

      await page.goto('/dashboard/leaves')
      await expectAuthenticated(page)
    })

    test('should handle expired sessions gracefully', async ({ page, context }) => {
      const user = getTestUser('employee')
      await login(page, user)

      // Clear cookies to simulate expired session
      await context.clearCookies()

      await page.goto('/dashboard')
      await expectUnauthenticated(page)
    })
  })

  test.describe('Role-Based Access', () => {
    test('employee should not access admin routes', async ({ page }) => {
      const user = getTestUser('employee')
      await login(page, user)

      await page.goto('/dashboard/admin')
      await expect(page).toHaveURL('/unauthorized')
    })

    test('admin should access admin routes', async ({ page }) => {
      const user = getTestUser('admin')
      await login(page, user)

      await page.goto('/dashboard/admin')
      await expect(page).toHaveURL('/dashboard/admin')
      await expect(page.locator('text=Admin Dashboard')).toBeVisible()
    })

    test('hr should access admin routes', async ({ page }) => {
      const user = getTestUser('hr')
      await login(page, user)

      await page.goto('/dashboard/admin')
      await expect(page).toHaveURL('/dashboard/admin')
    })

    test('manager should access approvals but not admin', async ({ page }) => {
      const user = getTestUser('manager')
      await login(page, user)

      await page.goto('/dashboard/approvals')
      await expect(page).toHaveURL('/dashboard/approvals')

      await page.goto('/dashboard/admin')
      await expect(page).toHaveURL('/unauthorized')
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await clearAuth(page)

      await page.goto('/dashboard')
      await expectUnauthenticated(page)

      await page.goto('/dashboard/profile')
      await expectUnauthenticated(page)

      await page.goto('/dashboard/leaves')
      await expectUnauthenticated(page)
    })

    test('should allow access to public routes', async ({ page }) => {
      await clearAuth(page)

      await page.goto('/login')
      await expect(page).toHaveURL('/login')

      await page.goto('/register')
      await expect(page).toHaveURL('/register')
    })
  })

  test.describe('Security', () => {
    test('should not expose sensitive data in client', async ({ page }) => {
      const user = getTestUser('employee')
      await login(page, user)

      const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage))
      expect(localStorage).not.toContain('service_role')
      expect(localStorage).not.toContain('secret')
    })

    test('should handle concurrent login attempts', async ({ page, context }) => {
      const user = getTestUser('employee')

      // Open two pages
      const page2 = await context.newPage()

      // Login on both simultaneously
      await Promise.all([login(page, user), login(page2, user)])

      // Both should be authenticated
      await expectAuthenticated(page)
      await expectAuthenticated(page2)

      await page2.close()
    })

    test('should sanitize error messages', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[name="email"]', '<script>alert("xss")</script>')
      await page.fill('input[name="password"]', 'password')
      await page.click('button[type="submit"]')

      // Should not execute script or show raw error
      const alerts = []
      page.on('dialog', (dialog) => alerts.push(dialog.message()))

      await page.waitForTimeout(1000)
      expect(alerts).toHaveLength(0)
    })
  })
})
