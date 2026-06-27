import { expect, test, type Page } from '@playwright/test'
import { cleanupArticle, cleanupWindow, seedArticle, seedWindow } from '../helpers/seedContent'

const BASE_URL = 'http://localhost:3000'
const WINDOW_SLUG = 'e2e-head-window'
const ARTICLE_SLUG = 'e2e-head-article'

async function bypassCookieBanner(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      consentId: 'e2e-test',
      categories: ['essential', 'analytics', 'functional', 'marketing'],
      timestamp: Date.now(),
      version: '1.0',
    }))
  })
}

async function getDynamicFaviconHref(page: Page) {
  return page.locator('link[data-dimm-dynamic-favicon]').getAttribute('href')
}

async function expectTitle(page: Page, title: string) {
  await expect.poll(() => page.title()).toBe(title)
}

test.describe('Window head sync', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeAll(async () => {
    await Promise.all([
      seedWindow(WINDOW_SLUG),
      seedArticle(ARTICLE_SLUG),
    ])
  })

  test.afterAll(async () => {
    await Promise.all([
      cleanupWindow(WINDOW_SLUG),
      cleanupArticle(ARTICLE_SLUG),
    ])
  })

  test.beforeEach(async ({ page }) => {
    await bypassCookieBanner(page)
  })

  test('focused windows update the favicon and document title', async ({ page }) => {
    await page.goto(`${BASE_URL}/?open=${WINDOW_SLUG},${ARTICLE_SLUG}`)

    const windowPanel = page.locator(`[data-secondary-window="${WINDOW_SLUG}"]`)
    const articlePanel = page.locator(`[data-secondary-window="${ARTICLE_SLUG}"]`)

    await expect(windowPanel).toBeVisible({ timeout: 10000 })
    await expect(articlePanel).toBeVisible({ timeout: 10000 })

    await expectTitle(page, `E2E ${ARTICLE_SLUG} \u2014 Dimm's OS`)
    const articleFavicon = await getDynamicFaviconHref(page)
    expect(articleFavicon).toMatch(/^data:image\/png/)

    await windowPanel.locator('.win-titlebar--bar').click()
    await expectTitle(page, `E2E ${WINDOW_SLUG} \u2014 Dimm's OS`)
    const windowFavicon = await getDynamicFaviconHref(page)
    expect(windowFavicon).toMatch(/^data:image\/png/)
    expect(windowFavicon).not.toBe(articleFavicon)

    await expect(page.locator('html')).toHaveAttribute('data-display-options-ready', 'true')
    await page.evaluate(() => window.dispatchEvent(new Event('dimmos:open-display-options')))

    const displayOptions = page.getByRole('dialog', { name: 'Display Options' })
    await expect(displayOptions).toBeVisible({ timeout: 10000 })
    await expectTitle(page, 'Display Options')
    const systemFavicon = await getDynamicFaviconHref(page)
    expect(systemFavicon).toMatch(/^data:image\/png/)
    expect(systemFavicon).not.toBe(windowFavicon)

    await displayOptions.locator('[aria-label="Close"]').click()
    await expect(displayOptions).not.toBeVisible({ timeout: 5000 })
    await expectTitle(page, `E2E ${WINDOW_SLUG} \u2014 Dimm's OS`)

    await windowPanel.locator('[aria-label="Close"]').first().click()
    await expect(windowPanel).not.toBeVisible({ timeout: 5000 })
    await expectTitle(page, `E2E ${ARTICLE_SLUG} \u2014 Dimm's OS`)

    await articlePanel.locator('[aria-label="Close"]').first().click()
    await expect(articlePanel).not.toBeVisible({ timeout: 5000 })
    await expectTitle(page, "Dimm's OS")
    await expect(page.locator('link[data-dimm-dynamic-favicon]')).toHaveCount(0)
  })
})
