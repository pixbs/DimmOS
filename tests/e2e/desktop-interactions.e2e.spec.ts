import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { seedWindow, cleanupWindow } from '../helpers/seedContent'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'e2e-desktop-interactions'

async function getConsentVersion(request: APIRequestContext) {
  try {
    const response = await request.get(`${BASE_URL}/api/globals/cookie-settings?depth=0`)
    const data = await response.json()
    return typeof data?.consentVersion === 'string' ? data.consentVersion : '1.0'
  } catch {
    return '1.0'
  }
}

function bypassCookies(page: Page, version: string) {
  return page.addInitScript((consentVersion) => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      consentId: 'e2e-test',
      categories: ['essential', 'analytics', 'functional', 'marketing'],
      timestamp: Date.now(),
      version: consentVersion,
    }))
  }, version)
}

async function dismissCookieNotice(page: Page) {
  await page.addStyleTag({
    content: '[data-cookie-banner] { display: none !important; pointer-events: none !important; }',
  })
  await page.evaluate(() => window.dispatchEvent(new Event('dimmos:close-cookie-banner')))
}

test.describe('Desktop interactions', () => {
  test.beforeAll(async () => {
    await seedWindow(SLUG)
  })

  test.afterAll(async () => {
    await cleanupWindow(SLUG)
  })

  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page, request }) => {
    await bypassCookies(page, await getConsentVersion(request))
  })

  test('website cursor is the default and identifies window-opening shortcuts', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-testid="preloader"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {})
    await dismissCookieNotice(page)

    await expect(page.locator('html')).toHaveAttribute('data-dimm-cursor', 'website')
    await page.mouse.move(80, 120)
    await expect(page.locator('[data-dimm-custom-cursor]')).toBeVisible({ timeout: 5000 })

    await page.locator(`a[href="/${SLUG}"]`).hover()
    await expect(page.locator('[data-dimm-custom-cursor]')).toHaveAttribute('data-cursor-kind', 'window')
  })

  test('display options toggles back to the system cursor and persists it', async ({ page }) => {
    await page.goto(BASE_URL)
    await dismissCookieNotice(page)
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

  test('desktop shortcuts can be dragged and persist after reload', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-testid="preloader"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {})
    await dismissCookieNotice(page)

    const shortcut = page.locator(`[data-draggable-shortcut][data-shortcut-slug="${SLUG}"]`)
    await expect(shortcut).toBeVisible({ timeout: 10000 })
    const before = await shortcut.boundingBox()
    expect(before).not.toBeNull()
    if (!before) return

    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
    await page.mouse.down()
    await page.mouse.move(before.x + before.width / 2 + 180, before.y + before.height / 2 + 110, { steps: 8 })
    await page.mouse.up()

    await expect
      .poll(async () =>
        page.evaluate((slug) => {
          const raw = localStorage.getItem('shortcut-positions:v1')
          return raw ? JSON.parse(raw)[slug]?.x : undefined
        }, SLUG),
      )
      .toBeGreaterThan(0)

    const after = await shortcut.boundingBox()
    expect(after).not.toBeNull()
    if (!after) return
    expect(after.x).toBeGreaterThan(before.x + 40)
    expect(after.y).toBeGreaterThan(before.y + 40)

    await page.reload()
    await dismissCookieNotice(page)
    const restored = page.locator(`[data-draggable-shortcut][data-shortcut-slug="${SLUG}"]`)
    await expect(restored).toBeVisible({ timeout: 10000 })
    const surfaceBox = await page.locator('[data-shortcut-surface]').boundingBox()
    const saved = await page.evaluate((slug) => {
      const raw = localStorage.getItem('shortcut-positions:v1')
      if (!raw) return undefined
      const positions = JSON.parse(raw) as Record<string, { x: number, y: number }>
      return positions[slug]
    }, SLUG)
    expect(surfaceBox).not.toBeNull()
    expect(saved).toBeDefined()
    if (!surfaceBox || !saved) return

    await expect
      .poll(async () => {
        const box = await restored.boundingBox()
        return box ? Math.abs(box.x - (surfaceBox.x + saved.x)) : Number.POSITIVE_INFINITY
      })
      .toBeLessThan(4)
    await expect
      .poll(async () => {
        const box = await restored.boundingBox()
        return box ? Math.abs(box.y - (surfaceBox.y + saved.y)) : Number.POSITIVE_INFINITY
      })
      .toBeLessThan(4)
  })

  test('reset shortcut positions clears persisted desktop icon placement', async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.setItem('shortcut-positions:v1', JSON.stringify({ [slug]: { x: 260, y: 180 } }))
    }, SLUG)

    await page.goto(BASE_URL)
    await dismissCookieNotice(page)
    const shortcut = page.locator(`[data-draggable-shortcut][data-shortcut-slug="${SLUG}"]`)
    await expect(shortcut).toBeVisible({ timeout: 10000 })

    await page.evaluate(() => window.dispatchEvent(new Event('dimmos:reset-shortcut-positions')))
    await expect.poll(() => page.evaluate(() => localStorage.getItem('shortcut-positions:v1'))).toBeNull()
  })

  test('wallpaper context menu opens display options', async ({ page }) => {
    await page.goto(BASE_URL)
    await dismissCookieNotice(page)
    await expect(page.locator('html')).toHaveAttribute('data-display-options-ready', 'true')

    await page.locator('[data-shortcut-surface]').click({ button: 'right', position: { x: 900, y: 520 } })
    const menu = page.getByRole('menu', { name: 'Wallpaper menu' })
    await expect(menu).toBeVisible()
    await menu.getByRole('menuitem', { name: 'Display options' }).click()
    await expect(page.getByRole('dialog', { name: 'Display Options' })).toBeVisible()
  })

  test('shortcut context menu opens a DimmOS window', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-testid="preloader"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {})
    await dismissCookieNotice(page)

    await page.locator(`[data-draggable-shortcut][data-shortcut-slug="${SLUG}"]`).click({ button: 'right' })
    const menu = page.getByRole('menu', { name: 'Shortcut menu' })
    await expect(menu).toBeVisible()
    await menu.getByRole('menuitem', { name: 'Open in new DimmOS window' }).click()
    await expect(page.locator(`[data-secondary-window="${SLUG}"]`)).toBeVisible({ timeout: 10000 })
  })

  test('taskbar context menu can close the current window', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-testid="preloader"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {})
    await dismissCookieNotice(page)
    await page.locator(`[data-draggable-shortcut][data-shortcut-slug="${SLUG}"]`).click()
    await expect(page.locator(`[data-secondary-window="${SLUG}"]`)).toBeVisible({ timeout: 10000 })

    await page.locator(`[data-taskbar-window="${SLUG}"]`).click({ button: 'right' })
    const menu = page.getByRole('menu', { name: 'Taskbar menu' })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: 'Copy link address' })).toBeVisible()
    await menu.getByRole('menuitem', { name: 'Close' }).click()
    await expect(page.locator(`[data-secondary-window="${SLUG}"]`)).not.toBeVisible({ timeout: 5000 })
  })

  test('window and link context menus are shown inside windows', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.locator('[data-testid="preloader"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {})
    await dismissCookieNotice(page)
    await page.locator(`[data-draggable-shortcut][data-shortcut-slug="${SLUG}"]`).click()
    const win = page.locator(`[data-secondary-window="${SLUG}"]`)
    await expect(win).toBeVisible({ timeout: 10000 })

    await win.locator('.win-titlebar--bar').click({ button: 'right' })
    await expect(page.getByRole('menu', { name: 'Window menu' })).toBeVisible()
    await page.keyboard.press('Escape')

    await win.locator('.win-scroll').evaluate((node) => {
      const link = document.createElement('a')
      link.href = '/about'
      link.textContent = 'Injected internal link'
      link.setAttribute('data-injected-link', '')
      node.appendChild(link)
    })
    await win.locator('[data-injected-link]').click({ button: 'right' })
    const menu = page.getByRole('menu', { name: 'Link menu' })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem').first()).toContainText('Open')
    await expect(menu.getByRole('menuitem', { name: 'Open in new browser tab' })).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: 'Copy link address' })).toBeVisible()
  })
})
