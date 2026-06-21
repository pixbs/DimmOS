import { test, expect, type Page } from '@playwright/test'
import { seedWindow, cleanupWindow } from '../helpers/seedContent'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'e2e-desktop-interactions'

function bypassCookies(page: Page) {
  return page.addInitScript(() => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      consentId: 'e2e-test',
      categories: ['essential', 'analytics', 'functional', 'marketing'],
      timestamp: Date.now(),
      version: '1.0',
    }))
  })
}

test.describe('Desktop interactions', () => {
  test.beforeAll(async () => {
    await seedWindow(SLUG)
  })

  test.afterAll(async () => {
    await cleanupWindow(SLUG)
  })

  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await bypassCookies(page)
  })

  test('website cursor is the default and identifies window-opening shortcuts', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-testid="preloader"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {})

    await expect(page.locator('html')).toHaveAttribute('data-dimm-cursor', 'website')
    await page.mouse.move(80, 120)
    await expect(page.locator('[data-dimm-custom-cursor]')).toBeVisible({ timeout: 5000 })

    await page.locator(`a[href="/${SLUG}"]`).hover()
    await expect(page.locator('[data-dimm-custom-cursor]')).toHaveAttribute('data-cursor-kind', 'window')
  })

  test('display options toggles back to the system cursor and persists it', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page.locator('html')).toHaveAttribute('data-dimm-cursor', 'website')
    await expect(page.locator('html')).toHaveAttribute('data-display-options-ready', 'true')
    await page.evaluate(() => window.dispatchEvent(new Event('dimmos:open-display-options')))

    const panel = page.getByRole('dialog', { name: 'Display Options' })
    await expect(panel).toBeVisible()
    const toggle = panel.getByRole('switch', { name: 'Use website cursor' })
    await expect(toggle).toHaveAttribute('aria-checked', 'true')

    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute('data-dimm-cursor', 'system')
    await expect(toggle).toHaveAttribute('aria-checked', 'false')

    const raw = await page.evaluate(() => localStorage.getItem('display-options:v1'))
    expect(raw).toContain('"cursorMode":"system"')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-dimm-cursor', 'system')
    await expect(page.locator('[data-dimm-custom-cursor]')).toHaveCount(0)
  })
})
