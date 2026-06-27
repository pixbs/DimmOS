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
    // seedWindow already sets showShortcut: true, making this window pre-rendered.
    await seedWindow(SLUG)
  })

  test.afterAll(async () => {
    await cleanupWindow(SLUG)
  })

  test.beforeEach(bypassCookieBanner)

  test('route preloader is visible in the initial streamed shell', async ({ page }) => {
    const response = await page.request.fetch(BASE_URL)
    const body = await response.text()
    expect(body).toContain('data-route-preloader')
  })

  test('route preloader disappears after the desktop shell loads', async ({ page }) => {
    await page.goto(BASE_URL)
    const preloader = page.locator('[data-route-preloader]')
    await expect(preloader).not.toBeVisible({ timeout: 10000 })
  })

  test('route preloader can be observed during committed navigation', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'commit' })
    const preloader = page.locator('[data-route-preloader]')
    const isVisible = await preloader.isVisible().catch(() => false)
    if (isVisible) await expect(preloader).toHaveAttribute('role', 'status')
    await expect(preloader).not.toBeVisible({ timeout: 10000 })
  })

  test('pre-rendered shortcut window is in DOM but not visible before opening', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-route-preloader]').waitFor({ state: 'hidden', timeout: 10000 })

    const windowEl = page.locator(`[data-secondary-window="${SLUG}"]`)
    await expect(windowEl).toHaveCount(1, { timeout: 5000 })
    await expect(windowEl).not.toBeVisible()
  })

  test('opening pre-rendered window shows content immediately without loading state', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-route-preloader]').waitFor({ state: 'hidden', timeout: 10000 })

    await page.locator(`a[href="/${SLUG}"]`).click()

    const windowEl = page.locator(`[data-secondary-window="${SLUG}"]`)
    await expect(windowEl).toBeVisible({ timeout: 2000 })
    await expect(windowEl.locator('[data-block-type="richText"]').first()).toBeVisible({ timeout: 2000 })
    await expect(page.getByText(/Loading/)).toHaveCount(0)
  })

  test('closing and reopening a pre-rendered window shows no loading state', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-route-preloader]').waitFor({ state: 'hidden', timeout: 10000 })

    await page.locator(`a[href="/${SLUG}"]`).click()
    const windowEl = page.locator(`[data-secondary-window="${SLUG}"]`)
    await expect(windowEl).toBeVisible({ timeout: 2000 })

    await windowEl.locator('[aria-label="Close"]').first().click()
    await expect(windowEl).not.toBeVisible({ timeout: 3000 })

    await page.locator(`a[href="/${SLUG}"]`).click()
    await expect(windowEl).toBeVisible({ timeout: 2000 })
    await expect(page.getByText(/Loading/)).toHaveCount(0)
  })
})
