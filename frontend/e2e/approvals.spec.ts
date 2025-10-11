/**
 * Approval Workflow E2E Tests
 *
 * Tests for manager/HR approval workflows and notifications
 */

import { test, expect } from '@playwright/test'
import { getTestUser } from './fixtures/test-users'
import { login } from './utils/auth-helpers'
import {
  waitForToast,
  fillFormField,
  waitForLoadingToFinish,
  clickButton,
  waitForDialog,
  getTableRowByText,
} from './utils/test-helpers'

test.describe('Approval Workflows', () => {
  test.describe('Manager Approvals', () => {
    test.beforeEach(async ({ page }) => {
      const manager = getTestUser('manager')
      await login(page, manager)
      await page.goto('/dashboard/approvals')
    })

    test('should display pending approvals', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('text=Pending Approvals')).toBeVisible()
      await expect(page.locator('[data-testid="pending-approvals"]')).toBeVisible()
    })

    test('should approve leave request', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const pendingRow = page.locator('[data-testid="approval-row"]').first()
      await pendingRow.locator('[data-testid="approve-button"]').click()

      await waitForDialog(page)
      await fillFormField(page, 'Comments', 'Approved - have a good time')
      await clickButton(page, 'Confirm Approval')

      await waitForToast(page, 'Leave request approved')
      await expect(pendingRow.locator('[data-testid="status-badge"]')).toHaveText('Approved')
    })

    test('should reject leave request', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const pendingRow = page.locator('[data-testid="approval-row"]').first()
      await pendingRow.locator('[data-testid="reject-button"]').click()

      await waitForDialog(page)
      await fillFormField(page, 'Comments', 'Insufficient staffing during this period')
      await clickButton(page, 'Confirm Rejection')

      await waitForToast(page, 'Leave request rejected')
      await expect(pendingRow.locator('[data-testid="status-badge"]')).toHaveText('Rejected')
    })

    test('should require comments for rejection', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const pendingRow = page.locator('[data-testid="approval-row"]').first()
      await pendingRow.locator('[data-testid="reject-button"]').click()

      await waitForDialog(page)
      await clickButton(page, 'Confirm Rejection')

      await expect(page.locator('text=Comments are required for rejection')).toBeVisible()
    })

    test('should view employee leave history before approval', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const pendingRow = page.locator('[data-testid="approval-row"]').first()
      await pendingRow.locator('[data-testid="view-history"]').click()

      await waitForDialog(page)
      await expect(page.locator('text=Leave History')).toBeVisible()
      await expect(page.locator('[data-testid="leave-history-list"]')).toBeVisible()
    })

    test('should check team calendar before approval', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await clickButton(page, 'Team Calendar')
      await expect(page).toHaveURL('/dashboard/team-calendar')
      await expect(page.locator('[data-testid="calendar"]')).toBeVisible()
    })

    test('should filter approvals by department', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await page.selectOption('select[name="department"]', 'Engineering')
      await waitForLoadingToFinish(page)

      const rows = page.locator('[data-testid="approval-row"]')
      const count = await rows.count()

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText('Engineering')
      }
    })

    test('should bulk approve multiple requests', async ({ page }) => {
      await waitForLoadingToFinish(page)

      // Select multiple requests
      await page.check('[data-testid="select-all"]')

      await clickButton(page, 'Approve Selected')
      await waitForDialog(page)
      await clickButton(page, 'Confirm')

      await waitForToast(page, 'requests approved')
    })
  })

  test.describe('HR Approvals', () => {
    test.beforeEach(async ({ page }) => {
      const hr = getTestUser('hr')
      await login(page, hr)
      await page.goto('/dashboard/approvals')
    })

    test('should see all pending approvals across departments', async ({ page }) => {
      await waitForLoadingToFinish(page)

      await expect(page.locator('[data-testid="all-departments"]')).toBeVisible()
    })

    test('should override manager decision', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const approvedRow = page.locator('tr:has-text("Approved")').first()

      if ((await approvedRow.count()) > 0) {
        await approvedRow.locator('[data-testid="override-button"]').click()

        await waitForDialog(page)
        await fillFormField(page, 'Reason', 'Policy violation')
        await clickButton(page, 'Confirm Override')

        await waitForToast(page, 'Decision overridden')
      }
    })

    test('should handle special leave types', async ({ page }) => {
      await waitForLoadingToFinish(page)

      // Special leaves might require HR approval
      const specialLeaveRow = page.locator('[data-testid="approval-row"]:has-text("Maternity")').first()

      if ((await specialLeaveRow.count()) > 0) {
        await specialLeaveRow.locator('[data-testid="approve-button"]').click()
        await waitForDialog(page)
        await clickButton(page, 'Confirm Approval')
        await waitForToast(page, 'approved')
      }
    })
  })

  test.describe('Approval Notifications', () => {
    test('should show notification when leave is approved', async ({ page, context }) => {
      // Employee submits leave
      const employee = getTestUser('employee')
      await login(page, employee)
      await page.goto('/dashboard/leaves')

      await clickButton(page, 'New Leave Request')
      await waitForDialog(page)

      // Fill and submit
      await fillFormField(page, 'Leave Type', 'Annual Leave')
      await fillFormField(page, 'Start Date', '2025-12-01')
      await fillFormField(page, 'End Date', '2025-12-02')
      await fillFormField(page, 'Reason', 'Test notification')
      await clickButton(page, 'Submit Request')

      await waitForToast(page, 'submitted')

      // Manager approves in new tab
      const managerPage = await context.newPage()
      const manager = getTestUser('manager')
      await login(managerPage, manager)
      await managerPage.goto('/dashboard/approvals')

      const pendingRow = managerPage.locator('tr:has-text("Test notification")').first()
      await pendingRow.locator('[data-testid="approve-button"]').click()
      await managerPage.click('button:has-text("Confirm")')

      // Check employee receives notification
      await page.reload()
      await expect(page.locator('[data-testid="notification-badge"]')).toBeVisible()

      await managerPage.close()
    })
  })

  test.describe('Approval History', () => {
    test('should display approval audit trail', async ({ page }) => {
      const manager = getTestUser('manager')
      await login(page, manager)
      await page.goto('/dashboard/approvals')

      await clickButton(page, 'History')
      await expect(page.locator('[data-testid="approval-history"]')).toBeVisible()

      // Should show who approved/rejected and when
      await expect(page.locator('text=Approved by').or(page.locator('text=Rejected by'))).toBeVisible()
    })
  })

  test.describe('Approval Accessibility', () => {
    test('should support keyboard navigation for approvals', async ({ page }) => {
      const manager = getTestUser('manager')
      await login(page, manager)
      await page.goto('/dashboard/approvals')

      await waitForLoadingToFinish(page)

      // Navigate using keyboard
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      await waitForDialog(page)
    })

    test('should have accessible status indicators', async ({ page }) => {
      const manager = getTestUser('manager')
      await login(page, manager)
      await page.goto('/dashboard/approvals')

      const statusBadge = page.locator('[data-testid="status-badge"]').first()
      await expect(statusBadge).toHaveAttribute('role', 'status')
    })
  })
})
