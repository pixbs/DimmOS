import { test, expect, type Page } from '@playwright/test'
import { seedCaseStudy, cleanupCaseStudy } from '../helpers/seedContent'

const SLUG = 'e2e-case-study'
const BASE_URL = 'http://localhost:3000'

async function expectDrawerOpen(page: Page) {
  const drawer = page.locator('[data-testid="page-drawer"]')
  await expect(drawer).toHaveAttribute('data-state', 'open', { timeout: 10000 })
}

test.describe('Case study section blocks', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test.beforeAll(async () => {
    await seedCaseStudy(SLUG)
  })
  test.afterAll(async () => {
    await cleanupCaseStudy(SLUG)
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

  test('renders every section block', async ({ page }) => {
    await page.goto(`${BASE_URL}/${SLUG}`)
    await expectDrawerOpen(page)
    const win = page.locator('[data-testid="page-drawer"]')
    for (const blockType of [
      'hero',
      'summary',
      'stats',
      'imageSection',
      'description',
      'sectionTitle',
      'articleList',
    ]) {
      await expect(win.locator(`[data-block-type="${blockType}"]`).first()).toBeVisible({
        timeout: 10000,
      })
    }
  })

  test('stats expose their value + suffix to assistive tech', async ({ page }) => {
    await page.goto(`${BASE_URL}/${SLUG}`)
    await expectDrawerOpen(page)
    await expect(page.locator('[data-block-type="stats"]')).toContainText('10Mil')
    await expect(page.locator('[data-block-type="stats"]')).toContainText('Customer satisfaction')
  })

  test('summary renders both columns', async ({ page }) => {
    await page.goto(`${BASE_URL}/${SLUG}`)
    await expectDrawerOpen(page)
    const summary = page.locator('[data-block-type="summary"]')
    await expect(summary).toContainText('Overview')
    await expect(summary).toContainText('What we did')
  })

  test('works section renders sibling article cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/${SLUG}`)
    await expectDrawerOpen(page)
    await expect(
      page.locator('[data-block-type="articleList"] [data-article-card]').first(),
    ).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-block-type="articleList"]')).toContainText('Northwind Rebrand')
  })
})
