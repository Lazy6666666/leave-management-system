/**
 * Admin Operations E2E Tests
 *
 * Tests for user management, reports, and org statistics
 */

import { test, expect } from '@playwright/test'
import { getTestUser } from './fixtures/test-users'
import { login } from './utils/auth-helpers'
import {
  waitForToast,
  fillFormField,
  clickButton,
  waitForDialog,
  waitForLoadingToFinish,
  getTableRowByText,
} from './utils/test-helpers'

test.describe('Admin Operations', () => {
  test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin/users')
    })

    test('should display user list', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="user-list"]')).toBeVisible()
      await expect(page.locator('table')).toBeVisible()
    })

    test('should create new user', async ({ page }) => {
      await clickButton(page, 'Create User')
      await waitForDialog(page)

      await fillFormField(page, 'Email', 'newuser@test.com')
      await fillFormField(page, 'Full Name', 'New Test User')
      await fillFormField(page, 'Password', 'Test123!@#')
      await page.selectOption('select[name="role"]', 'employee')
      await page.selectOption('select[name="department"]', 'Engineering')

      await clickButton(page, 'Create User')
      await waitForToast(page, 'User created')

      await expect(page.locator('text=newuser@test.com')).toBeVisible()
    })

    test('should edit user details', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const userRow = page.locator('[data-testid="user-row"]').first()
      await userRow.locator('[data-testid="edit-button"]').click()

      await waitForDialog(page)
      await fillFormField(page, 'Full Name', 'Updated Name')
      await clickButton(page, 'Save Changes')

      await waitForToast(page, 'User updated')
    })

    test('should deactivate user', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const userRow = page.locator('[data-testid="user-row"]').first()
      await userRow.locator('[data-testid="deactivate-button"]').click()

      await waitForDialog(page)
      await clickButton(page, 'Confirm')

      await waitForToast(page, 'User deactivated')
      await expect(userRow.locator('[data-testid="status-badge"]')).toHaveText('Inactive')
    })

    test('should reset user password', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const userRow = page.locator('[data-testid="user-row"]').first()
      await userRow.locator('[data-testid="reset-password"]').click()

      await waitForDialog(page)
      await clickButton(page, 'Send Reset Link')

      await waitForToast(page, 'Password reset link sent')
    })

    test('should search users', async ({ page }) => {
      await fillFormField(page, 'Search', 'test')
      await waitForLoadingToFinish(page)

      const rows = page.locator('[data-testid="user-row"]')
      const count = await rows.count()

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText('test', { ignoreCase: true })
      }
    })

    test('should filter users by role', async ({ page }) => {
      await page.selectOption('select[name="role"]', 'admin')
      await waitForLoadingToFinish(page)

      const rows = page.locator('[data-testid="user-row"]')
      const count = await rows.count()

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText('Admin')
      }
    })

    test('should filter users by department', async ({ page }) => {
      await page.selectOption('select[name="department"]', 'Engineering')
      await waitForLoadingToFinish(page)

      const rows = page.locator('[data-testid="user-row"]')
      const count = await rows.count()

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText('Engineering')
      }
    })

    test('should export user list', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download')
      await clickButton(page, 'Export')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/users.*\.(csv|xlsx)/)
    })
  })

  test.describe('Reports', () => {
    test.beforeEach(async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin/reports')
    })

    test('should generate leave summary report', async ({ page }) => {
      await clickButton(page, 'Generate Report')
      await waitForDialog(page)

      await page.selectOption('select[name="report_type"]', 'leave_summary')
      await fillFormField(page, 'Start Date', '2025-01-01')
      await fillFormField(page, 'End Date', '2025-12-31')

      await clickButton(page, 'Generate')
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="report-results"]')).toBeVisible()
    })

    test('should export report to CSV', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const downloadPromise = page.waitForEvent('download')
      await clickButton(page, 'Export to CSV')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/report.*\.csv/)
    })

    test('should export report to PDF', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const downloadPromise = page.waitForEvent('download')
      await clickButton(page, 'Export to PDF')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/report.*\.pdf/)
    })

    test('should filter report by department', async ({ page }) => {
      await page.selectOption('select[name="department"]', 'Engineering')
      await clickButton(page, 'Apply Filter')

      await waitForLoadingToFinish(page)
      await expect(page.locator('text=Engineering')).toBeVisible()
    })

    test('should display analytics charts', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="chart-leave-trends"]')).toBeVisible()
      await expect(page.locator('[data-testid="chart-department-breakdown"]')).toBeVisible()
    })
  })

  test.describe('Organization Statistics', () => {
    test.beforeEach(async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin')
    })

    test('should display org statistics dashboard', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="org-stats"]')).toBeVisible()
    })

    test('should show total employees count', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="total-employees"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-employees"]')).toContainText(/\d+/)
    })

    test('should show pending approvals count', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="pending-approvals"]')).toBeVisible()
    })

    test('should show leave balance statistics', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="leave-balance-stats"]')).toBeVisible()
    })

    test('should display department breakdown chart', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="department-chart"]')).toBeVisible()
    })

    test('should display leave trends chart', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="leave-trends-chart"]')).toBeVisible()
    })

    test('should refresh statistics', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await clickButton(page, 'Refresh')
      await waitForLoadingToFinish(page)

      await waitForToast(page, 'Statistics updated')
    })

    test('should export statistics', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download')
      await clickButton(page, 'Export Statistics')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toBeTruthy()
    })
  })

  test.describe('Leave Types Management', () => {
    test.beforeEach(async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin/leave-types')
    })

    test('should display leave types list', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="leave-types-list"]')).toBeVisible()
    })

    test('should create new leave type', async ({ page }) => {
      await clickButton(page, 'Add Leave Type')
      await waitForDialog(page)

      await fillFormField(page, 'Name', 'Compassionate Leave')
      await fillFormField(page, 'Description', 'Leave for family emergencies')
      await fillFormField(page, 'Default Days', '5')

      await clickButton(page, 'Create')
      await waitForToast(page, 'Leave type created')
    })

    test('should edit leave type', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const leaveTypeRow = page.locator('[data-testid="leave-type-row"]').first()
      await leaveTypeRow.locator('[data-testid="edit-button"]').click()

      await waitForDialog(page)
      await fillFormField(page, 'Default Days', '10')

      await clickButton(page, 'Save')
      await waitForToast(page, 'Leave type updated')
    })

    test('should deactivate leave type', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const leaveTypeRow = page.locator('[data-testid="leave-type-row"]').first()
      await leaveTypeRow.locator('[data-testid="deactivate-button"]').click()

      await waitForDialog(page)
      await clickButton(page, 'Confirm')

      await waitForToast(page, 'Leave type deactivated')
    })
  })

  test.describe('Audit Logs', () => {
    test.beforeEach(async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin/audit-logs')
    })

    test('should display audit logs', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="audit-logs"]')).toBeVisible()
    })

    test('should filter logs by action type', async ({ page }) => {
      await page.selectOption('select[name="action"]', 'create')
      await waitForLoadingToFinish(page)

      const rows = page.locator('[data-testid="log-row"]')
      const count = await rows.count()

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText('Create', { ignoreCase: true })
      }
    })

    test('should filter logs by date range', async ({ page }) => {
      await fillFormField(page, 'Start Date', '2025-01-01')
      await fillFormField(page, 'End Date', '2025-12-31')

      await clickButton(page, 'Apply Filter')
      await waitForLoadingToFinish(page)
    })

    test('should search logs by user', async ({ page }) => {
      await fillFormField(page, 'Search User', 'admin')
      await waitForLoadingToFinish(page)

      const rows = page.locator('[data-testid="log-row"]')
      const count = await rows.count()

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText('admin', { ignoreCase: true })
      }
    })
  })

  test.describe('Admin Accessibility', () => {
    test('should have accessible admin navigation', async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin')

      const nav = page.locator('nav[aria-label="Admin navigation"]')
      await expect(nav).toBeVisible()
    })

    test('should support keyboard navigation in admin panel', async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin')

      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      // Should navigate to first admin section
      await expect(page).toHaveURL(/\/dashboard\/admin/)
    })
  })
})
