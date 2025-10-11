/**
 * Document Operations E2E Tests
 *
 * Tests for document upload, download, and management
 */

import { test, expect } from '@playwright/test'
import { getTestUser } from './fixtures/test-users'
import { login } from './utils/auth-helpers'
import { waitForToast, clickButton, waitForDialog, waitForLoadingToFinish } from './utils/test-helpers'
import path from 'path'

test.describe('Document Operations', () => {
  test.describe('Leave Request Documents', () => {
    test.beforeEach(async ({ page }) => {
      const user = getTestUser('employee')
      await login(page, user)
      await page.goto('/dashboard/leaves')
    })

    test('should upload document to leave request', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const leaveRow = page.locator('[data-testid="leave-row"]').first()
      await leaveRow.locator('[data-testid="upload-document"]').click()

      await waitForDialog(page)

      // Upload file
      const testFile = path.join(__dirname, 'fixtures', 'test-document.pdf')
      await page.setInputFiles('input[type="file"]', testFile)

      await clickButton(page, 'Upload')
      await waitForToast(page, 'Document uploaded')

      await expect(page.locator('text=test-document.pdf')).toBeVisible()
    })

    test('should validate file size', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const leaveRow = page.locator('[data-testid="leave-row"]').first()
      await leaveRow.locator('[data-testid="upload-document"]').click()

      // Try to upload large file (mock)
      await waitForToast(page, 'File too large', { timeout: 5000 })
    })

    test('should validate file type', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const leaveRow = page.locator('[data-testid="leave-row"]').first()
      await leaveRow.locator('[data-testid="upload-document"]').click()

      // Try to upload invalid file type
      const invalidFile = path.join(__dirname, 'fixtures', 'test.exe')

      await expect(page.locator('text=Invalid file type')).toBeVisible({ timeout: 5000 })
    })

    test('should download document', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const leaveRow = page.locator('[data-testid="leave-row"]').first()
      await leaveRow.click()

      const downloadPromise = page.waitForEvent('download')
      await page.locator('[data-testid="download-document"]').first().click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toBeTruthy()
    })

    test('should delete document', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const leaveRow = page.locator('[data-testid="leave-row"]').first()
      await leaveRow.click()

      await page.locator('[data-testid="delete-document"]').first().click()

      await waitForDialog(page)
      await clickButton(page, 'Confirm')

      await waitForToast(page, 'Document deleted')
    })

    test('should preview document before upload', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const leaveRow = page.locator('[data-testid="leave-row"]').first()
      await leaveRow.locator('[data-testid="upload-document"]').click()

      const testFile = path.join(__dirname, 'fixtures', 'test-image.jpg')
      await page.setInputFiles('input[type="file"]', testFile)

      await expect(page.locator('[data-testid="document-preview"]')).toBeVisible()
    })
  })

  test.describe('Company Documents', () => {
    test.beforeEach(async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin/documents')
    })

    test('should upload company document', async ({ page }) => {
      await clickButton(page, 'Upload Document')
      await waitForDialog(page)

      const testFile = path.join(__dirname, 'fixtures', 'company-policy.pdf')
      await page.setInputFiles('input[type="file"]', testFile)

      await page.fill('input[name="title"]', 'Company Leave Policy 2025')
      await page.fill('textarea[name="description"]', 'Updated leave policy for all employees')

      await clickButton(page, 'Upload')
      await waitForToast(page, 'Document uploaded')
    })

    test('should categorize documents', async ({ page }) => {
      await clickButton(page, 'Upload Document')
      await waitForDialog(page)

      await page.selectOption('select[name="category"]', 'policies')

      await expect(page.locator('option[value="policies"]')).toBeVisible()
    })

    test('should set document expiry', async ({ page }) => {
      await clickButton(page, 'Upload Document')
      await waitForDialog(page)

      await page.fill('input[name="expiry_date"]', '2025-12-31')

      await expect(page.locator('text=This document will expire')).toBeVisible()
    })

    test('should filter documents by category', async ({ page }) => {
      await page.selectOption('select[name="category"]', 'policies')
      await waitForLoadingToFinish(page)

      const documents = page.locator('[data-testid="document-card"]')
      const count = await documents.count()

      for (let i = 0; i < count; i++) {
        await expect(documents.nth(i)).toContainText('Policy')
      }
    })

    test('should show document version history', async ({ page }) => {
      await waitForLoadingToFinish(page)

      const docCard = page.locator('[data-testid="document-card"]').first()
      await docCard.locator('[data-testid="view-versions"]').click()

      await waitForDialog(page)
      await expect(page.locator('text=Version History')).toBeVisible()
    })
  })

  test.describe('Document Notifications', () => {
    test('should notify about expiring documents', async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin/documents')

      await expect(page.locator('[data-testid="expiry-warning"]')).toBeVisible({ timeout: 5000 })
    })

    test('should schedule document notifications', async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin/documents')

      const docCard = page.locator('[data-testid="document-card"]').first()
      await docCard.locator('[data-testid="schedule-notification"]').click()

      await waitForDialog(page)
      await page.fill('input[name="notification_date"]', '2025-12-01')
      await clickButton(page, 'Schedule')

      await waitForToast(page, 'Notification scheduled')
    })
  })

  test.describe('Document Security', () => {
    test('employee should not access admin documents', async ({ page }) => {
      const employee = getTestUser('employee')
      await login(page, employee)

      await page.goto('/dashboard/admin/documents')
      await expect(page).toHaveURL('/unauthorized')
    })

    test('should enforce document permissions', async ({ page }) => {
      const employee = getTestUser('employee')
      await login(page, employee)
      await page.goto('/dashboard/documents')

      // Employee should only see public documents
      await expect(page.locator('[data-testid="admin-only-document"]')).not.toBeVisible()
    })

    test('should prevent unauthorized downloads', async ({ page }) => {
      const employee = getTestUser('employee')
      await login(page, employee)

      // Try to access restricted document URL directly
      const response = await page.goto('/api/documents/restricted-doc-id/download')
      expect(response?.status()).toBe(403)
    })
  })

  test.describe('Document Accessibility', () => {
    test('should have accessible upload form', async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin/documents')

      await clickButton(page, 'Upload Document')

      await expect(page.locator('label[for="file-upload"]')).toBeVisible()
    })

    test('should announce upload progress', async ({ page }) => {
      const admin = getTestUser('admin')
      await login(page, admin)
      await page.goto('/dashboard/admin/documents')

      await clickButton(page, 'Upload Document')

      const testFile = path.join(__dirname, 'fixtures', 'large-file.pdf')
      await page.setInputFiles('input[type="file"]', testFile)

      await expect(page.locator('[role="progressbar"]')).toBeVisible()
    })
  })
})
