import { test, expect, Page } from '@playwright/test'
import { seedWindow, cleanupWindow } from '../helpers/seedContent'

const SLUG = 'e2e-test-window'
const BASE_URL = 'http://localhost:3000'

async function expectDrawerOpen(page: Page) {
  const drawer = page.locator('[data-testid="page-drawer"]')
  await expect(drawer).toHaveClass(/translate-y-0/, { timeout: 10000 })
}

test.describe('Windows page drawer', () => {
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

  test('navigating to a window slug opens the PageDrawer', async ({ page }) => {
    await page.goto(`${BASE_URL}/${SLUG}`)
    await expectDrawerOpen(page)
  })

  test('richText block is rendered inside the drawer', async ({ page }) => {
    await page.goto(`${BASE_URL}/${SLUG}`)
    await expectDrawerOpen(page)
    await expect(page.locator('[data-block-type="richText"]')).toBeVisible({ timeout: 10000 })
  })
})
