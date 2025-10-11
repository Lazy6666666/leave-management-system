/**
 * Authentication Helper Functions
 *
 * Utilities for handling authentication in E2E tests
 */

import { Page, expect } from '@playwright/test'
import { TestUser } from '../fixtures/test-users'

export async function login(page: Page, user: TestUser) {
  await page.goto('/login')

  // Fill in login form
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 })

  // Verify successful login
  await expect(page.locator('text=' + user.name)).toBeVisible()
}

export async function logout(page: Page) {
  // Open user menu
  await page.click('[data-testid="user-menu"]')

  // Click logout
  await page.click('text=Logout')

  // Wait for redirect to login
  await page.waitForURL('/login')
}

export async function expectAuthenticated(page: Page) {
  // Should not redirect to login
  await expect(page).not.toHaveURL('/login')

  // Should see dashboard elements
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
}

export async function expectUnauthenticated(page: Page) {
  // Should redirect to login
  await page.waitForURL('/login')
  await expect(page).toHaveURL('/login')
}

export async function expectRole(page: Page, role: string) {
  // Navigate to dashboard
  await page.goto('/dashboard')

  // Check role-specific elements
  if (role === 'admin' || role === 'hr') {
    await expect(page.locator('text=Admin')).toBeVisible()
  }

  if (role === 'manager') {
    await expect(page.locator('text=Approvals')).toBeVisible()
  }
}

export async function clearAuth(page: Page) {
  // Clear all cookies and storage
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}
