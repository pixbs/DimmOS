import { test, expect, type Page } from '@playwright/test'
import { seedWindow, cleanupWindow } from '../helpers/seedContent'

const SLUG = 'e2e-test-window'
const BASE_URL = 'http://localhost:3000'

async function expectPanelOpen(page: Page) {
  const panel = page.locator('[data-testid="page-drawer"]')
  await expect(panel).toHaveAttribute('data-state', 'open', { timeout: 10000 })
}

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

test.describe('Windows — shared setup', () => {
  test.beforeAll(async () => {
    await seedWindow(SLUG)
  })
  test.afterAll(async () => {
    await cleanupWindow(SLUG)
  })

  test.describe('mobile drawer (unchanged)', () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test.beforeEach(bypassCookieBanner)

    test('navigating to a window slug opens the page panel', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      await expectPanelOpen(page)
    })

    test('richText block is rendered inside the panel', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      await expectPanelOpen(page)
      await expect(page.locator('[data-block-type="richText"]')).toBeVisible({ timeout: 10000 })
    })

    test('drag handle pill is visible on mobile', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      await expectPanelOpen(page)
      await expect(page.locator('.win-draghandle')).toBeVisible()
    })

    test('title bar is not visible on mobile', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      await expectPanelOpen(page)
      await expect(page.locator('.win-titlebar--bar')).not.toBeVisible()
    })
  })

  test.describe('desktop window', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test.beforeEach(bypassCookieBanner)

    test('panel has data-window-panel and data-state="open"', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      const panel = page.locator('[data-testid="page-drawer"]')
      await expect(panel).toHaveAttribute('data-window-panel', '')
      await expect(panel).toHaveAttribute('data-state', 'open', { timeout: 10000 })
    })

    test('title bar is visible on desktop', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      await expectPanelOpen(page)
      await expect(page.locator('.win-titlebar--bar')).toBeVisible()
    })

    test('drag handle is hidden on desktop', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      await expectPanelOpen(page)
      await expect(page.locator('.win-draghandle')).not.toBeVisible()
    })

    test('title bar shows the window title', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      await expectPanelOpen(page)
      // seedWindow creates title "E2E e2e-test-window"
      await expect(page.locator('.win-titlebar--bar')).toContainText('E2E e2e-test-window')
    })

    test('close button navigates to /', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      await expectPanelOpen(page)
      await page.locator('[aria-label="Close"]').click()
      await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 5000 })
    })

    test('richText block is rendered inside the window', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      await expectPanelOpen(page)
      await expect(page.locator('[data-block-type="richText"]')).toBeVisible({ timeout: 10000 })
    })

    test('window position is retained after reload', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}`)
      await expectPanelOpen(page)

      const panel = page.locator('[data-testid="page-drawer"]')

      // Simulate drag by injecting a saved position into localStorage
      await page.evaluate(() => {
        localStorage.setItem('window-positions', JSON.stringify({
          'e2e-test-window': { x: 200, y: 150 },
        }))
      })
      await page.reload()
      await expectPanelOpen(page)

      // After reload the panel should have --win-x and --win-y set
      const winX = await panel.evaluate((el) => el.style.getPropertyValue('--win-x'))
      const winY = await panel.evaluate((el) => el.style.getPropertyValue('--win-y'))
      expect(winX).toBe('200px')
      expect(winY).toBe('150px')
    })

    test('clicking a shortcut on desktop opens it as secondary window without navigating', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.locator(`a[href="/${SLUG}"]`).click()
      // URL updates shallowly via history.replaceState — no full page navigation
      await expect(page).toHaveURL(`${BASE_URL}/${SLUG}`, { timeout: 5000 })
      // Secondary window renders without loading the page as primary
      await expect(page.locator(`[data-secondary-window="${SLUG}"]`)).toBeVisible({ timeout: 10000 })
    })

    test('focusing the active secondary window keeps the cosmetic URL', async ({ page }) => {
      await page.addInitScript(() => {
        sessionStorage.setItem('open-windows', JSON.stringify([
          { slug: 'e2e-test-window', zIndex: 51, minimized: false },
        ]))
      })
      await page.goto(BASE_URL)
      const win = page.locator(`[data-secondary-window="${SLUG}"]`)
      await expect(win).toBeVisible({ timeout: 10000 })
      await expect(page).toHaveURL(`${BASE_URL}/${SLUG}`)
      await win.click()
      await page.waitForTimeout(300)
      await expect(page).toHaveURL(`${BASE_URL}/${SLUG}`)
    })

    test('closing a secondary window resets the cosmetic URL to /', async ({ page }) => {
      await page.addInitScript(() => {
        sessionStorage.setItem('open-windows', JSON.stringify([
          { slug: 'e2e-test-window', zIndex: 51, minimized: false },
        ]))
      })
      await page.goto(BASE_URL)
      const win = page.locator(`[data-secondary-window="${SLUG}"]`)
      await expect(win).toBeVisible({ timeout: 10000 })
      await win.locator('[aria-label="Close"]').first().click()
      await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 3000 })
    })
  })
})
