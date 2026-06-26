import { test, expect } from '@playwright/test'
import { cleanupWindow, seedStartupWindow } from '../helpers/seedContent'

const BASE_URL = 'http://localhost:3000'
const FIRST = 'e2e-startup-first'
const SECOND = 'e2e-startup-second'

test.describe('Managed startup windows', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeAll(async () => {
    await seedStartupWindow(FIRST, { order: 1, viewports: ['desktop'] })
    await seedStartupWindow(SECOND, { order: 2, viewports: ['desktop'] })
  })

  test.afterAll(async () => {
    await cleanupWindow(FIRST)
    await cleanupWindow(SECOND)
  })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'cookie-consent',
        JSON.stringify({
          consentId: 'e2e-test',
          categories: ['essential', 'analytics', 'functional', 'marketing'],
          timestamp: Date.now(),
          version: '1.0',
        }),
      )
    })
  })

  test('opens all eligible startup content windows on root once per page session', async ({ page }) => {
    await page.goto(BASE_URL)

    await expect(page.locator(`[data-secondary-window="${FIRST}"]`)).toBeVisible({ timeout: 15000 })
    await expect(page.locator(`[data-secondary-window="${SECOND}"]`)).toBeVisible({ timeout: 15000 })
    await expect(page.locator(`[data-secondary-window="${FIRST}"]`)).toHaveCount(1)
    await expect(page.locator(`[data-secondary-window="${SECOND}"]`)).toHaveCount(1)

    await page.goto(`${BASE_URL}/about`)
    await page.goto(BASE_URL)

    await expect(page.locator(`[data-secondary-window="${FIRST}"]`)).toHaveCount(1)
    await expect(page.locator(`[data-secondary-window="${SECOND}"]`)).toHaveCount(1)
  })
})
