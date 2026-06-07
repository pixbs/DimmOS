import { test, expect, type Page } from '@playwright/test'
import {
  seedToolbarWindow,
  cleanupToolbarWindow,
  seedArticleListWindow,
  cleanupArticleListWindow,
} from '../helpers/seedContent'

const BASE_URL = 'http://localhost:3000'

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

// Open a secondary window by injecting it into sessionStorage before navigating to /
function openSecondaryWindow(page: Page, slug: string) {
  return page.addInitScript((s) => {
    sessionStorage.setItem('open-windows', JSON.stringify([
      { slug: s, zIndex: 51, minimized: false, cascadeIndex: 0 },
    ]))
  }, slug)
}

async function waitForWindowContent(page: Page, slug: string) {
  const win = page.locator(`[data-secondary-window="${slug}"]`)
  await expect(win).toBeVisible({ timeout: 10000 })
  // Wait for loading to finish
  await expect(win.locator('text=Loading…')).toHaveCount(0, { timeout: 10000 })
  return win
}

// ─── Toolbar visibility ────────────────────────────────────────────────────────

test.describe('Window toolbar — visibility', () => {
  const NO_TOOLBAR_SLUG = 'e2e-toolbar-none'
  const ALL_FLAGS_SLUG = 'e2e-toolbar-all'
  const SEARCH_ONLY_SLUG = 'e2e-toolbar-search'
  const VIEW_ONLY_SLUG = 'e2e-toolbar-view'
  const HISTORY_ONLY_SLUG = 'e2e-toolbar-history'

  test.beforeAll(async () => {
    await Promise.all([
      seedToolbarWindow(NO_TOOLBAR_SLUG, {}),
      seedToolbarWindow(ALL_FLAGS_SLUG, {
        windowDisplaySearch: true,
        windowDisplayViewToggle: true,
        windowDefaultView: 'grid',
        windowDisplayHistory: true,
      }),
      seedToolbarWindow(SEARCH_ONLY_SLUG, { windowDisplaySearch: true }),
      seedToolbarWindow(VIEW_ONLY_SLUG, {
        windowDisplayViewToggle: true,
        windowDefaultView: 'table',
      }),
      seedToolbarWindow(HISTORY_ONLY_SLUG, { windowDisplayHistory: true }),
    ])
  })

  test.afterAll(async () => {
    await Promise.all([
      cleanupToolbarWindow(NO_TOOLBAR_SLUG),
      cleanupToolbarWindow(ALL_FLAGS_SLUG),
      cleanupToolbarWindow(SEARCH_ONLY_SLUG),
      cleanupToolbarWindow(VIEW_ONLY_SLUG),
      cleanupToolbarWindow(HISTORY_ONLY_SLUG),
    ])
  })

  test.use({ viewport: { width: 1280, height: 800 } })

  test('no toolbar rendered when all toolbar flags are false', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, NO_TOOLBAR_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, NO_TOOLBAR_SLUG)
    await expect(win.locator('[data-window-toolbar]')).toHaveCount(0)
  })

  test('toolbar is rendered when any toolbar flag is true', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, ALL_FLAGS_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, ALL_FLAGS_SLUG)
    await expect(win.locator('[data-window-toolbar]')).toBeVisible()
  })

  test('search input visible when windowDisplaySearch is true', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, SEARCH_ONLY_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, SEARCH_ONLY_SLUG)
    await expect(win.locator('[data-window-toolbar] [aria-label="Search"]')).toBeVisible()
  })

  test('no search input when windowDisplaySearch is false', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, VIEW_ONLY_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, VIEW_ONLY_SLUG)
    await expect(win.locator('[data-window-toolbar] [aria-label="Search"]')).toHaveCount(0)
  })

  test('grid and table view buttons visible when windowDisplayViewToggle is true', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, VIEW_ONLY_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, VIEW_ONLY_SLUG)
    await expect(win.locator('[aria-label="Grid view"]')).toBeVisible()
    await expect(win.locator('[aria-label="Table view"]')).toBeVisible()
  })

  test('no view toggle buttons when windowDisplayViewToggle is false', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, SEARCH_ONLY_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, SEARCH_ONLY_SLUG)
    await expect(win.locator('[aria-label="Grid view"]')).toHaveCount(0)
    await expect(win.locator('[aria-label="Table view"]')).toHaveCount(0)
  })

  test('back and forward buttons visible when windowDisplayHistory is true', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, HISTORY_ONLY_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, HISTORY_ONLY_SLUG)
    await expect(win.locator('[aria-label="Go back"]')).toBeVisible()
    await expect(win.locator('[aria-label="Go forward"]')).toBeVisible()
  })

  test('back button is disabled on initial window open', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, HISTORY_ONLY_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, HISTORY_ONLY_SLUG)
    await expect(win.locator('[aria-label="Go back"]')).toBeDisabled()
  })

  test('forward button is disabled on initial window open', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, HISTORY_ONLY_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, HISTORY_ONLY_SLUG)
    await expect(win.locator('[aria-label="Go forward"]')).toBeDisabled()
  })

  test('view toggle initialises with windowDefaultView="table" active', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, VIEW_ONLY_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, VIEW_ONLY_SLUG)
    await expect(win.locator('[data-window-toolbar]')).toHaveAttribute('data-view-mode', 'table')
  })

  test('all toolbar sections rendered together when all flags are true', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, ALL_FLAGS_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, ALL_FLAGS_SLUG)
    const toolbar = win.locator('[data-window-toolbar]')
    await expect(toolbar).toBeVisible()
    await expect(toolbar.locator('[aria-label="Go back"]')).toBeVisible()
    await expect(toolbar.locator('[aria-label="Search"]')).toBeVisible()
    await expect(toolbar.locator('[aria-label="Grid view"]')).toBeVisible()
    await expect(toolbar.locator('[aria-label="Table view"]')).toBeVisible()
  })
})

// ─── View toggle ──────────────────────────────────────────────────────────────

test.describe('Window toolbar — view toggle', () => {
  const SLUG = 'e2e-toolbar-view-toggle'

  test.beforeAll(async () => {
    await seedToolbarWindow(SLUG, {
      windowDisplayViewToggle: true,
      windowDefaultView: 'grid',
    })
  })

  test.afterAll(async () => {
    await cleanupToolbarWindow(SLUG)
  })

  test.use({ viewport: { width: 1280, height: 800 } })

  test('clicking table view button changes data-view-mode to table', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, SLUG)
    const toolbar = win.locator('[data-window-toolbar]')
    await expect(toolbar).toHaveAttribute('data-view-mode', 'grid')
    await win.locator('[aria-label="Table view"]').click()
    await expect(toolbar).toHaveAttribute('data-view-mode', 'table')
  })

  test('clicking grid view button changes data-view-mode back to grid', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, SLUG)
    const toolbar = win.locator('[data-window-toolbar]')
    await win.locator('[aria-label="Table view"]').click()
    await expect(toolbar).toHaveAttribute('data-view-mode', 'table')
    await win.locator('[aria-label="Grid view"]').click()
    await expect(toolbar).toHaveAttribute('data-view-mode', 'grid')
  })
})

// ─── Article list — search + view modes ───────────────────────────────────────

test.describe('Window toolbar — articleList search', () => {
  const WIN_SLUG = 'e2e-toolbar-article-search'
  const ARTICLE_SLUGS = [
    'e2e-art-alpha-project',
    'e2e-art-beta-service',
    'e2e-art-gamma-study',
  ]

  test.beforeAll(async () => {
    await seedArticleListWindow(WIN_SLUG, ARTICLE_SLUGS, {
      windowDisplaySearch: true,
      windowDisplayViewToggle: true,
      windowDefaultView: 'grid',
    })
  })

  test.afterAll(async () => {
    await cleanupArticleListWindow(WIN_SLUG, ARTICLE_SLUGS)
  })

  test.use({ viewport: { width: 1280, height: 800 } })

  test('all articles visible before searching', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)
    await expect(win.locator('[data-block-type="articleList"] [data-article-item]')).toHaveCount(3, { timeout: 10000 })
  })

  test('typing in search box filters articles by title (case-insensitive)', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)
    const searchInput = win.locator('[aria-label="Search"]')
    await searchInput.fill('alpha')
    // Only alpha article visible
    await expect(win.locator('[data-article-item]')).toHaveCount(1)
    await expect(win.locator('[data-article-item]').first()).toContainText('alpha', { ignoreCase: true })
  })

  test('clearing search box restores all articles', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)
    const searchInput = win.locator('[aria-label="Search"]')
    await searchInput.fill('beta')
    await expect(win.locator('[data-article-item]')).toHaveCount(1)
    await searchInput.clear()
    await expect(win.locator('[data-article-item]')).toHaveCount(3)
  })

  test('no matches shows empty state, not an error', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)
    await win.locator('[aria-label="Search"]').fill('zzznomatch')
    await expect(win.locator('[data-article-item]')).toHaveCount(0)
  })

  test('switching to table view changes articleList layout', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)
    const articleList = win.locator('[data-block-type="articleList"]')
    await expect(articleList).toHaveAttribute('data-view-mode', 'grid')
    await win.locator('[aria-label="Table view"]').click()
    await expect(articleList).toHaveAttribute('data-view-mode', 'table')
  })

  test('grid view uses grid layout, table view uses list layout', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)
    // Default grid: each article item exists
    await expect(win.locator('[data-article-item]')).toHaveCount(3)
    await win.locator('[aria-label="Table view"]').click()
    // Table: items still exist but in table layout
    await expect(win.locator('[data-article-item]')).toHaveCount(3)
    await expect(win.locator('[data-block-type="articleList"]')).toHaveAttribute('data-view-mode', 'table')
  })
})

// ─── In-window navigation (history) ───────────────────────────────────────────

test.describe('Window toolbar — in-window history', () => {
  const WIN_SLUG = 'e2e-toolbar-history-nav'
  const ARTICLE_SLUGS = ['e2e-hist-article-one', 'e2e-hist-article-two']

  test.beforeAll(async () => {
    await seedArticleListWindow(WIN_SLUG, ARTICLE_SLUGS, {
      windowDisplayHistory: true,
    })
  })

  test.afterAll(async () => {
    await cleanupArticleListWindow(WIN_SLUG, ARTICLE_SLUGS)
  })

  test.use({ viewport: { width: 1280, height: 800 } })

  test('clicking article item with displayHistory navigates in-window (no new window)', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)
    const articlesCount = await win.locator('[data-article-item]').count()
    expect(articlesCount).toBeGreaterThan(0)

    // Click the first article
    await win.locator('[data-article-item]').first().click()

    // No new secondary window should be opened (only 1 window with WIN_SLUG still present)
    await expect(page.locator(`[data-secondary-window="${WIN_SLUG}"]`)).toHaveCount(1, { timeout: 3000 })
    // The original article list should no longer be visible (content replaced)
    await expect(win.locator('[data-article-item]')).toHaveCount(0, { timeout: 5000 })
  })

  test('back button becomes enabled after navigating in-window', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)
    await expect(win.locator('[aria-label="Go back"]')).toBeDisabled()

    await win.locator('[data-article-item]').first().click()
    await expect(win.locator('[data-article-item]')).toHaveCount(0, { timeout: 5000 })

    await expect(win.locator('[aria-label="Go back"]')).toBeEnabled({ timeout: 3000 })
  })

  test('clicking back returns to previous content (article list)', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)
    const initialCount = await win.locator('[data-article-item]').count()

    await win.locator('[data-article-item]').first().click()
    await expect(win.locator('[data-article-item]')).toHaveCount(0, { timeout: 5000 })

    await win.locator('[aria-label="Go back"]').click()
    await expect(win.locator('[data-article-item]')).toHaveCount(initialCount, { timeout: 5000 })
  })

  test('forward button becomes enabled after going back', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)

    await win.locator('[data-article-item]').first().click()
    await expect(win.locator('[data-article-item]')).toHaveCount(0, { timeout: 5000 })
    await win.locator('[aria-label="Go back"]').click()
    await expect(win.locator('[data-article-item]')).toHaveCount(ARTICLE_SLUGS.length, { timeout: 5000 })

    await expect(win.locator('[aria-label="Go forward"]')).toBeEnabled({ timeout: 3000 })
  })

  test('clicking forward goes back to the article after going back', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)

    await win.locator('[data-article-item]').first().click()
    await expect(win.locator('[data-article-item]')).toHaveCount(0, { timeout: 5000 })
    await win.locator('[aria-label="Go back"]').click()
    await expect(win.locator('[data-article-item]')).toHaveCount(ARTICLE_SLUGS.length, { timeout: 5000 })
    await win.locator('[aria-label="Go forward"]').click()
    // Back to the article (no article list items)
    await expect(win.locator('[data-article-item]')).toHaveCount(0, { timeout: 5000 })
  })

  test('window title updates to the navigated article title', async ({ page }) => {
    await bypassCookies(page)
    openSecondaryWindow(page, WIN_SLUG)
    await page.goto(BASE_URL)
    const win = await waitForWindowContent(page, WIN_SLUG)

    // Initial title matches the list window
    const titleBar = win.locator('.win-titlebar--bar')
    await expect(titleBar).toContainText('E2E e2e-toolbar-history-nav')

    // Navigate to first article
    const firstArticleTitle = await win.locator('[data-article-item]').first().textContent()
    await win.locator('[data-article-item]').first().click()
    await expect(win.locator('[data-article-item]')).toHaveCount(0, { timeout: 5000 })

    // Title should now reflect the article
    await expect(titleBar).not.toContainText('E2E e2e-toolbar-history-nav', { timeout: 3000 })
  })
})

// ─── Mobile — back button only ────────────────────────────────────────────────

test.describe('Window toolbar — mobile', () => {
  const SLUG = 'e2e-toolbar-mobile'

  test.beforeAll(async () => {
    await seedToolbarWindow(SLUG, {
      windowDisplaySearch: true,
      windowDisplayViewToggle: true,
      windowDisplayHistory: true,
    })
  })

  test.afterAll(async () => {
    await cleanupToolbarWindow(SLUG)
  })

  test.use({ viewport: { width: 375, height: 812 } })

  test('on mobile, back button is visible when displayHistory is true', async ({ page }) => {
    await bypassCookies(page)
    await page.goto(`${BASE_URL}/${SLUG}`)
    const drawer = page.locator('[data-testid="page-drawer"]')
    await expect(drawer).toHaveAttribute('data-state', 'open', { timeout: 10000 })
    await expect(drawer.locator('[aria-label="Go back"]')).toBeVisible()
  })

  test('on mobile, search input is not visible (desktop-only toolbar)', async ({ page }) => {
    await bypassCookies(page)
    await page.goto(`${BASE_URL}/${SLUG}`)
    const drawer = page.locator('[data-testid="page-drawer"]')
    await expect(drawer).toHaveAttribute('data-state', 'open', { timeout: 10000 })
    // Search is hidden on mobile (< lg breakpoint)
    await expect(drawer.locator('[aria-label="Search"]')).not.toBeVisible()
  })

  test('on mobile, view toggle buttons are not visible (desktop-only)', async ({ page }) => {
    await bypassCookies(page)
    await page.goto(`${BASE_URL}/${SLUG}`)
    const drawer = page.locator('[data-testid="page-drawer"]')
    await expect(drawer).toHaveAttribute('data-state', 'open', { timeout: 10000 })
    await expect(drawer.locator('[aria-label="Grid view"]')).not.toBeVisible()
    await expect(drawer.locator('[aria-label="Table view"]')).not.toBeVisible()
  })
})
