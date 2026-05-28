import { test, expect, Page } from '@playwright/test'
import { seedArticle, cleanupArticle, seedWorks, cleanupWorks } from '../helpers/seedContent'

const SLUG = 'e2e-test-case-study'
const WORKS_SLUG = 'e2e-test-works'
const BASE_URL = 'http://localhost:3000'

async function expectDrawerOpen(page: Page) {
  const drawer = page.locator('[data-testid="page-drawer"]')
  await expect(drawer).toHaveAttribute('data-state', 'open', { timeout: 10000 })
}

test.describe('Works listing page', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  test.beforeAll(async () => {
    await seedWorks()
    await seedArticle(SLUG)
  })

  test.afterAll(async () => {
    await cleanupArticle(SLUG)
    await cleanupWorks()
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

  test('navigating to /works opens the PageDrawer', async ({ page }) => {
    await page.goto(`${BASE_URL}/${WORKS_SLUG}`)
    await expectDrawerOpen(page)
  })

  test('seeded case-study article appears as a card', async ({ page }) => {
    await page.goto(`${BASE_URL}/${WORKS_SLUG}`)
    await expectDrawerOpen(page)
    await expect(page.locator('[data-article-card]').filter({ hasText: `E2E ${SLUG}` })).toBeVisible({ timeout: 10000 })
  })

  test('clicking an article card navigates to its slug page', async ({ page }) => {
    await page.goto(`${BASE_URL}/${WORKS_SLUG}`)
    await expectDrawerOpen(page)

    const card = page.locator('[data-article-card]').filter({ hasText: `E2E ${SLUG}` })
    await card.click()

    await page.waitForURL(`${BASE_URL}/${SLUG}`, { timeout: 10000 })
    await expectDrawerOpen(page)
  })
})
