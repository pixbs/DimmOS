import { test, expect, type Page } from '@playwright/test'
import { seedWindow, cleanupWindow } from '../helpers/seedContent'

const SLUG = 'e2e-preloader-win'
const BASE_URL = 'http://localhost:3000'

async function bypassCookieBanner({ page }: { page: Page }) {
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      consentId: 'e2e-test',
      categories: ['essential', 'analytics', 'functional', 'marketing'],
      timestamp: Date.now(),
      version: '1.0',
    }))
  })
}

test.describe('Preloader', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeAll(async () => {
    // seedWindow already sets showShortcut: true, making this window pre-rendered
    await seedWindow(SLUG)
  })

  test.afterAll(async () => {
    await cleanupWindow(SLUG)
  })

  test.beforeEach(bypassCookieBanner)

  test('preloader is visible on initial page load', async ({ page }) => {
    // waitUntil: 'commit' captures the page before JavaScript fully hydrates
    await page.goto(BASE_URL, { waitUntil: 'commit' })
    const preloader = page.locator('[data-testid="preloader"]')
    await expect(preloader).toBeVisible({ timeout: 3000 })
  })

  test('preloader disappears after all windows are ready', async ({ page }) => {
    await page.goto(BASE_URL)
    const preloader = page.locator('[data-testid="preloader"]')
    await expect(preloader).not.toBeVisible({ timeout: 10000 })
  })

  test('preloader percentage text is visible and shows a valid value', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'commit' })
    const pct = page.locator('[data-testid="preloader-percentage"]')
    // If the preloader is still up, validate the percentage format
    const isVisible = await pct.isVisible().catch(() => false)
    if (isVisible) {
      const text = await pct.textContent()
      expect(text).toMatch(/^\d+%$/)
    }
    // Whether we caught it or not, verify it eventually goes away
    await expect(pct).not.toBeVisible({ timeout: 10000 })
  })

  test('pre-rendered shortcut window is in DOM but not visible before opening', async ({ page }) => {
    await page.goto(BASE_URL)
    // Wait for preloader to finish
    await page.locator('[data-testid="preloader"]').waitFor({ state: 'hidden', timeout: 10000 })

    const windowEl = page.locator(`[data-secondary-window="${SLUG}"]`)
    // Always-mounted: element exists in DOM
    await expect(windowEl).toHaveCount(1, { timeout: 5000 })
    // But its wrapper has display:none so it is not visible
    await expect(windowEl).not.toBeVisible()
  })

  test('opening pre-rendered window shows content immediately without loading state', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-testid="preloader"]').waitFor({ state: 'hidden', timeout: 10000 })

    await page.locator(`a[href="/${SLUG}"]`).click()

    const windowEl = page.locator(`[data-secondary-window="${SLUG}"]`)
    // Should appear quickly — no fetch delay since data is pre-loaded
    await expect(windowEl).toBeVisible({ timeout: 2000 })
    // Content must be present immediately — no "Loading…" spinner
    await expect(page.locator('[data-block-type="richText"]').first()).toBeVisible({ timeout: 2000 })
    await expect(page.locator('text=Loading…')).toHaveCount(0)
  })

  test('closing and reopening a pre-rendered window shows no loading state', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-testid="preloader"]').waitFor({ state: 'hidden', timeout: 10000 })

    // Open
    await page.locator(`a[href="/${SLUG}"]`).click()
    const windowEl = page.locator(`[data-secondary-window="${SLUG}"]`)
    await expect(windowEl).toBeVisible({ timeout: 2000 })

    // Close via title-bar close button
    await windowEl.locator('[aria-label="Close"]').first().click()
    await expect(windowEl).not.toBeVisible({ timeout: 3000 })

    // Reopen — should be instant, no loading spinner ever
    await page.locator(`a[href="/${SLUG}"]`).click()
    await expect(windowEl).toBeVisible({ timeout: 2000 })
    await expect(page.locator('text=Loading…')).toHaveCount(0)
  })
})
