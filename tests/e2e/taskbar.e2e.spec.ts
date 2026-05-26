import { test, expect } from '@playwright/test'
import { seedWindow, cleanupWindow } from '../helpers/seedContent'

const SLUG = 'e2e-taskbar-window'
const BASE_URL = 'http://localhost:3000'

test.describe('Taskbar', () => {
  test.beforeAll(async () => {
    await seedWindow(SLUG)
  })
  test.afterAll(async () => {
    await cleanupWindow(SLUG)
  })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookie-consent', JSON.stringify({
        consentId: 'e2e-test',
        categories: ['essential', 'analytics', 'functional', 'marketing'],
        timestamp: Date.now(),
        version: '1.0',
      }))
    })
  })

  test.describe('desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('taskbar is not visible when no secondary windows are open', async ({ page }) => {
      await page.goto(BASE_URL)
      const taskbar = page.locator('[data-taskbar]')
      // taskbar renders nothing when windows.length === 0
      await expect(taskbar).toHaveCount(0)
    })

    test('taskbar shows an entry for an open secondary window', async ({ page }) => {
      // Navigate to a window then inject a secondary window via URL param
      await page.goto(`${BASE_URL}/${SLUG}?open=${SLUG}`)
      const taskbar = page.locator('[data-taskbar]')
      await expect(taskbar).toBeVisible({ timeout: 10000 })
      await expect(taskbar).toContainText(SLUG)
    })
  })

  test.describe('mobile', () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test('taskbar is not visible on mobile', async ({ page }) => {
      await page.goto(`${BASE_URL}/${SLUG}?open=${SLUG}`)
      // data-taskbar element has display:none on mobile
      const taskbar = page.locator('[data-taskbar]')
      // Either absent or not visible
      const count = await taskbar.count()
      if (count > 0) {
        await expect(taskbar).not.toBeVisible()
      }
    })
  })
})
