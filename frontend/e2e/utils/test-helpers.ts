/**
 * General Test Helper Functions
 *
 * Reusable utilities for E2E tests
 */

import { Page, expect } from '@playwright/test'

/**
 * Wait for a toast notification to appear
 */
export async function waitForToast(page: Page, message?: string) {
  const toast = page.locator('[data-sonner-toast]')
  await expect(toast).toBeVisible({ timeout: 5000 })

  if (message) {
    await expect(toast).toContainText(message)
  }

  return toast
}

/**
 * Wait for toast to disappear
 */
export async function waitForToastToDisappear(page: Page) {
  const toast = page.locator('[data-sonner-toast]')
  await expect(toast).not.toBeVisible({ timeout: 10000 })
}

/**
 * Fill a form field by label
 */
export async function fillFormField(page: Page, label: string, value: string) {
  const input = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea`)
  await input.fill(value)
}

/**
 * Select from a dropdown by label
 */
export async function selectFromDropdown(page: Page, label: string, value: string) {
  const trigger = page.locator(`label:has-text("${label}") + [role="combobox"]`)
  await trigger.click()

  const option = page.locator(`[role="option"]:has-text("${value}")`)
  await option.click()
}

/**
 * Upload a file
 */
export async function uploadFile(page: Page, selector: string, filePath: string) {
  const fileInput = page.locator(selector)
  await fileInput.setInputFiles(filePath)
}

/**
 * Wait for loading to finish
 */
export async function waitForLoadingToFinish(page: Page) {
  // Wait for any loading spinners to disappear
  await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 })
}

/**
 * Check for accessibility violations using axe
 */
export async function checkA11y(page: Page, context?: string) {
  const { injectAxe, checkA11y: runAxe } = await import('@axe-core/playwright')

  await injectAxe(page)
  await runAxe(page, context, {
    detailedReport: true,
    detailedReportOptions: {
      html: true,
    },
  })
}

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

/**
 * Take a screenshot with a specific name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true })
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    )
  })
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded()
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(page: Page, urlPattern: string | RegExp) {
  return await page.waitForResponse((response) => {
    const url = response.url()
    return typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url)
  })
}

/**
 * Mock API response
 */
export async function mockAPIResponse(page: Page, urlPattern: string | RegExp, response: any) {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

/**
 * Get table row by text
 */
export async function getTableRowByText(page: Page, text: string) {
  return page.locator(`tr:has-text("${text}")`)
}

/**
 * Click button with text
 */
export async function clickButton(page: Page, text: string) {
  await page.locator(`button:has-text("${text}")`).click()
}

/**
 * Wait for dialog to open
 */
export async function waitForDialog(page: Page) {
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()
  return dialog
}

/**
 * Close dialog
 */
export async function closeDialog(page: Page) {
  const closeButton = page.locator('[role="dialog"] button[aria-label*="Close"]')
  await closeButton.click()
  await expect(page.locator('[role="dialog"]')).not.toBeVisible()
}
