/**
 * Authentication Setup for E2E Tests
 *
 * This setup file runs once before all tests to authenticate test users
 * and save their authentication state for reuse across tests
 */

import { test as setup, expect } from '@playwright/test'
import { TEST_USERS } from './fixtures/test-users'
import path from 'path'

const authFile = path.join(__dirname, '.auth', 'user.json')

setup('authenticate as employee', async ({ page }) => {
  const user = TEST_USERS.employee

  // Navigate to login page
  await page.goto('/login')

  // Fill in login form
  await page.fill('input[id="email"]', user.email)
  await page.fill('input[id="password"]', user.password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 15000 })

  // Verify successful login
  await expect(page.locator('text=' + user.name)).toBeVisible({ timeout: 10000 })

  // Save authentication state
  await page.context().storageState({ path: authFile })
})

setup.describe('setup for all roles', () => {
  setup('authenticate admin user', async ({ page }) => {
    const user = TEST_USERS.admin
    await page.goto('/login')
    await page.fill('input[id="email"]', user.email)
    await page.fill('input[id="password"]', user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 15000 })
    await page.context().storageState({ path: path.join(__dirname, '.auth', 'admin.json') })
  })

  setup('authenticate hr user', async ({ page }) => {
    const user = TEST_USERS.hr
    await page.goto('/login')
    await page.fill('input[id="email"]', user.email)
    await page.fill('input[id="password"]', user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 15000 })
    await page.context().storageState({ path: path.join(__dirname, '.auth', 'hr.json') })
  })

  setup('authenticate manager user', async ({ page }) => {
    const user = TEST_USERS.manager
    await page.goto('/login')
    await page.fill('input[id="email"]', user.email)
    await page.fill('input[id="password"]', user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 15000 })
    await page.context().storageState({ path: path.join(__dirname, '.auth', 'manager.json') })
  })
})
