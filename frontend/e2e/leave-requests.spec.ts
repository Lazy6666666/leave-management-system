/**
 * Leave Request E2E Tests
 *
 * Tests for creating, editing, viewing, and canceling leave requests
 */

import { test, expect } from '@playwright/test'
import { getTestUser } from './fixtures/test-users'
import { login } from './utils/auth-helpers'
import {
  waitForToast,
  fillFormField,
  selectFromDropdown,
  waitForLoadingToFinish,
  clickButton,
  waitForDialog,
  getTableRowByText,
} from './utils/test-helpers'

test.describe('Leave Requests', () => {
  test.beforeEach(async ({ page }) => {
    const user = getTestUser('employee')
    await login(page, user)
    await page.goto('/dashboard/leaves')
  })

  test.describe('Create Leave Request', () => {
    test('should create a new leave request successfully', async ({ page }) => {
      await clickButton(page, 'New Leave Request')
      await waitForDialog(page)

      // Fill form
      await selectFromDropdown(page, 'Leave Type', 'Annual Leave')
      await fillFormField(page, 'Start Date', '2025-12-01')
      await fillFormField(page, 'End Date', '2025-12-05')
      await fillFormField(page, 'Reason', 'Family vacation')

      // Submit
      await clickButton(page, 'Submit Request')

      // Verify success
      await waitForToast(page, 'Leave request submitted')
      await expect(page.locator('text=Family vacation')).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await clickButton(page, 'New Leave Request')
      await waitForDialog(page)

      await clickButton(page, 'Submit Request')

      await expect(page.locator('text=Leave type is required')).toBeVisible()
      await expect(page.locator('text=Start date is required')).toBeVisible()
      await expect(page.locator('text=End date is required')).toBeVisible()
    })

    test('should validate end date is after start date', async ({ page }) => {
      await clickButton(page, 'New Leave Request')
      await waitForDialog(page)

      await selectFromDropdown(page, 'Leave Type', 'Annual Leave')
      await fillFormField(page, 'Start Date', '2025-12-10')
      await fillFormField(page, 'End Date', '2025-12-05')

      await clickButton(page, 'Submit Request')

      await expect(page.locator('text=End date must be after start date')).toBeVisible()
    })

    test('should calculate leave days correctly', async ({ page }) => {
      await clickButton(page, 'New Leave Request')
      await waitForDialog(page)

      await selectFromDropdown(page, 'Leave Type', 'Annual Leave')
      await fillFormField(page, 'Start Date', '2025-12-01')
      await fillFormField(page, 'End Date', '2025-12-05')

      // Should show 5 days (excluding weekends if applicable)
      await expect(page.locator('text=5 day')).toBeVisible()
    })

    test('should check leave balance before submission', async ({ page }) => {
      await clickButton(page, 'New Leave Request')
      await waitForDialog(page)

      await selectFromDropdown(page, 'Leave Type', 'Annual Leave')
      await fillFormField(page, 'Start Date', '2025-12-01')
      await fillFormField(page, 'End Date', '2025-12-31')

      // Should warn if exceeding balance
      await expect(
        page.locator('text=Exceeds available balance').or(page.locator('text=Insufficient balance'))
      ).toBeVisible({ timeout: 5000 })
    })

    test('should support half-day leave requests', async ({ page }) => {
      await clickButton(page, 'New Leave Request')
      await waitForDialog(page)

      await selectFromDropdown(page, 'Leave Type', 'Annual Leave')
      await fillFormField(page, 'Start Date', '2025-12-01')
      await fillFormField(page, 'End Date', '2025-12-01')

      await page.check('input[name="is_half_day"]')

      await selectFromDropdown(page, 'Half Day Period', 'Morning')
      await fillFormField(page, 'Reason', 'Medical appointment')

      await clickButton(page, 'Submit Request')
      await waitForToast(page, 'submitted')
    })
  })

  test.describe('View Leave Requests', () => {
    test('should display leave request list', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="leave-list"]')).toBeVisible()
      await expect(page.locator('table')).toBeVisible()
    })

    test('should show leave request details', async ({ page }) => {
      await waitForLoadingToFinish(page)

      // Click first leave request
      const firstRow = page.locator('table tbody tr').first()
      await firstRow.click()

      // Should show details dialog or page
      await expect(page.locator('text=Leave Details').or(page.locator('text=Request Details'))).toBeVisible()
    })

    test('should filter leave requests by status', async ({ page }) => {
      await selectFromDropdown(page, 'Status', 'Pending')
      await waitForLoadingToFinish(page)

      // All visible requests should be pending
      const statusBadges = page.locator('[data-testid="status-badge"]')
      const count = await statusBadges.count()

      for (let i = 0; i < count; i++) {
        await expect(statusBadges.nth(i)).toHaveText('Pending')
      }
    })

    test('should filter leave requests by date range', async ({ page }) => {
      await fillFormField(page, 'From Date', '2025-01-01')
      await fillFormField(page, 'To Date', '2025-12-31')

      await clickButton(page, 'Filter')
      await waitForLoadingToFinish(page)

      await expect(page.locator('table tbody tr')).toHaveCount.greaterThan(0)
    })

    test('should search leave requests', async ({ page }) => {
      await fillFormField(page, 'Search', 'vacation')
      await waitForLoadingToFinish(page)

      const rows = page.locator('table tbody tr')
      const count = await rows.count()

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText('vacation', { ignoreCase: true })
      }
    })
  })

  test.describe('Edit Leave Request', () => {
    test('should edit pending leave request', async ({ page }) => {
      await waitForLoadingToFinish(page)

      // Find pending request
      const pendingRow = await getTableRowByText(page, 'Pending')
      await pendingRow.locator('[data-testid="edit-button"]').click()

      await waitForDialog(page)

      // Update reason
      await fillFormField(page, 'Reason', 'Updated vacation plans')
      await clickButton(page, 'Update Request')

      await waitForToast(page, 'updated')
      await expect(page.locator('text=Updated vacation plans')).toBeVisible()
    })

    test('should not allow editing approved leave requests', async ({ page }) => {
      await waitForLoadingToFinish(page)

      // Try to find approved request
      const approvedRow = page.locator('tr:has-text("Approved")').first()

      if ((await approvedRow.count()) > 0) {
        // Edit button should be disabled or not present
        await expect(approvedRow.locator('[data-testid="edit-button"]')).toBeDisabled()
      }
    })

    test('should validate edited dates', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const pendingRow = await getTableRowByText(page, 'Pending')
      await pendingRow.locator('[data-testid="edit-button"]').click()

      await fillFormField(page, 'Start Date', '2025-12-20')
      await fillFormField(page, 'End Date', '2025-12-10')

      await clickButton(page, 'Update Request')

      await expect(page.locator('text=End date must be after start date')).toBeVisible()
    })
  })

  test.describe('Cancel Leave Request', () => {
    test('should cancel pending leave request', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const pendingRow = await getTableRowByText(page, 'Pending')
      await pendingRow.locator('[data-testid="cancel-button"]').click()

      // Confirm cancellation
      await waitForDialog(page)
      await clickButton(page, 'Confirm')

      await waitForToast(page, 'cancelled')

      // Status should update to cancelled
      await expect(pendingRow.locator('[data-testid="status-badge"]')).toHaveText('Cancelled')
    })

    test('should show confirmation dialog before canceling', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const pendingRow = await getTableRowByText(page, 'Pending')
      await pendingRow.locator('[data-testid="cancel-button"]').click()

      const dialog = await waitForDialog(page)
      await expect(dialog).toContainText('Are you sure')
    })

    test('should not allow canceling approved leave requests', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const approvedRow = page.locator('tr:has-text("Approved")').first()

      if ((await approvedRow.count()) > 0) {
        await expect(approvedRow.locator('[data-testid="cancel-button"]')).toBeDisabled()
      }
    })
  })

  test.describe('Leave Balance', () => {
    test('should display current leave balance', async ({ page }) => {
      await expect(page.locator('[data-testid="leave-balance"]')).toBeVisible()
      await expect(page.locator('text=Available').or(page.locator('text=Balance'))).toBeVisible()
    })

    test('should show balance by leave type', async ({ page }) => {
      const balanceCard = page.locator('[data-testid="leave-balance"]')

      await expect(balanceCard.locator('text=Annual Leave')).toBeVisible()
      await expect(balanceCard.locator('text=Sick Leave')).toBeVisible()
    })

    test('should update balance after leave request', async ({ page }) => {
      // Get initial balance
      const initialBalance = await page.locator('[data-testid="annual-leave-balance"]').textContent()

      // Create new request
      await clickButton(page, 'New Leave Request')
      await waitForDialog(page)

      await selectFromDropdown(page, 'Leave Type', 'Annual Leave')
      await fillFormField(page, 'Start Date', '2025-12-01')
      await fillFormField(page, 'End Date', '2025-12-02')
      await fillFormField(page, 'Reason', 'Testing balance')

      await clickButton(page, 'Submit Request')
      await waitForToast(page, 'submitted')

      // Balance should be updated (pending deduction)
      const newBalance = await page.locator('[data-testid="annual-leave-balance"]').textContent()
      expect(newBalance).not.toBe(initialBalance)
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

      await clickButton(page, 'New Leave Request')
      await waitForDialog(page)

      // Form should be scrollable and usable
      await selectFromDropdown(page, 'Leave Type', 'Annual Leave')
      await fillFormField(page, 'Reason', 'Mobile test')
    })
  })

  test.describe('Accessibility', () => {
    test('should have accessible form labels', async ({ page }) => {
      await clickButton(page, 'New Leave Request')
      await waitForDialog(page)

      const leaveTypeLabel = page.locator('label:has-text("Leave Type")')
      await expect(leaveTypeLabel).toBeVisible()

      const startDateLabel = page.locator('label:has-text("Start Date")')
      await expect(startDateLabel).toBeVisible()
    })

    test('should support keyboard navigation', async ({ page }) => {
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter') // Open new request

      const dialog = await waitForDialog(page)
      await expect(dialog).toHaveAttribute('role', 'dialog')
    })
  })
})
