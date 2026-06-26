import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

async function clearConsent(page: Page) {
  await page.evaluate(() => localStorage.removeItem('cookie-consent'))
}

async function getConsent(page: Page) {
  const raw = await page.evaluate(() => localStorage.getItem('cookie-consent'))
  if (!raw) return null
  return JSON.parse(raw) as {
    consentId: string
    categories: string[]
    timestamp: number
    version: string
  }
}

async function expectDrawerOpen(dialog: ReturnType<Page['locator']>) {
  await expect(dialog).toBeVisible({ timeout: 10000 })
}

async function expectDrawerClosed(dialog: ReturnType<Page['locator']>) {
  await expect(dialog).not.toBeVisible({ timeout: 5000 })
}

test.describe('Cookie Banner', () => {
  test('banner shows on first visit (no localStorage)', async ({ page }) => {
    await page.goto(BASE_URL)
    await clearConsent(page)
    await page.reload()

    const banner = page.locator('[data-system-window-key="cookie-notice"]')
    await expectDrawerOpen(banner)
    await expect(banner.locator('h2')).toContainText(/cookies/i)
  })

  test('Accept All closes banner and stores all categories', async ({ page }) => {
    await page.goto(BASE_URL)
    await clearConsent(page)
    await page.reload()

    const banner = page.locator('[data-system-window-key="cookie-notice"]')
    await expectDrawerOpen(banner)
    await page.getByRole('button', { name: 'Accept All' }).click()

    // Banner should slide down
    await expectDrawerClosed(banner)

    const consent = await getConsent(page)
    expect(consent).not.toBeNull()
    expect(consent!.categories).toContain('essential')
    expect(consent!.categories).toContain('analytics')
    expect(consent!.categories).toContain('functional')
    expect(consent!.categories).toContain('marketing')
  })

  test('banner does not reappear after consent on reload', async ({ page }) => {
    await page.goto(BASE_URL)
    await clearConsent(page)
    await page.reload()

    const banner = page.locator('[data-system-window-key="cookie-notice"]')
    await expectDrawerOpen(banner)
    await page.getByRole('button', { name: 'Accept All' }).click()
    await expectDrawerClosed(banner)

    await page.reload()
    await page.waitForTimeout(1500)

    // After reload with valid consent, banner should stay closed
    await expectDrawerClosed(banner)
  })

  test('Reject stores only essential category', async ({ page }) => {
    await page.goto(BASE_URL)
    await clearConsent(page)
    await page.reload()

    const banner = page.locator('[data-system-window-key="cookie-notice"]')
    await expectDrawerOpen(banner)
    await page.getByRole('button', { name: 'Reject' }).click()

    const consent = await getConsent(page)
    expect(consent).not.toBeNull()
    expect(consent!.categories).toEqual(['essential'])
  })

  test('Configure opens the managed cookie preferences window', async ({ page }) => {
    await page.goto(BASE_URL)
    await clearConsent(page)
    await page.reload()

    const banner = page.locator('[data-system-window-key="cookie-notice"]')
    await expectDrawerOpen(banner)
    await page.getByRole('button', { name: 'Configure' }).click()

    await expectDrawerClosed(banner)
    await expect(page.locator('[data-system-window-key="cookie-preferences"]')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Save Preferences' })).toBeVisible({ timeout: 5000 })
  })

  test('Save preferences stores selected categories', async ({ page }) => {
    await page.goto(BASE_URL)
    await clearConsent(page)
    await page.reload()

    const banner = page.locator('[data-system-window-key="cookie-notice"]')
    await expectDrawerOpen(banner)
    await page.getByRole('button', { name: 'Configure' }).click()
    const preferences = page.locator('[data-system-window-key="cookie-preferences"]')
    await expect(preferences).toBeVisible()

    await expectDrawerClosed(banner)

    // Essential toggle should be disabled (always on)
    const essentialToggle = page.getByRole('switch', { name: /Toggle Essential/i })
    await expect(essentialToggle).toBeDisabled()

    // Enable analytics toggle if it isn't already
    const analyticsToggle = page.getByRole('switch', { name: /Toggle Analytics/i })
    const isChecked = await analyticsToggle.getAttribute('aria-checked')
    if (isChecked === 'false') {
      await analyticsToggle.click()
    }

    await page.getByRole('button', { name: 'Save Preferences' }).click()
    await expect(preferences).not.toBeVisible({ timeout: 5000 })

    const consent = await getConsent(page)
    expect(consent).not.toBeNull()
    expect(consent!.categories).toContain('essential')
    expect(consent!.categories).toContain('analytics')
  })

  test('Close in preferences without saving re-opens banner', async ({ page }) => {
    await page.goto(BASE_URL)
    await clearConsent(page)
    await page.reload()

    const banner = page.locator('[data-system-window-key="cookie-notice"]')
    await expectDrawerOpen(banner)
    await page.getByRole('button', { name: 'Configure' }).click()
    const preferences = page.locator('[data-system-window-key="cookie-preferences"]')

    await expect(page.getByRole('button', { name: 'Save Preferences' })).toBeVisible()

    // Close without saving
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(preferences).not.toBeVisible({ timeout: 5000 })

    // Banner should reappear since no consent was saved
    await expectDrawerOpen(banner)

    // Consent should still be null
    const consent = await getConsent(page)
    expect(consent).toBeNull()
  })

  test('update consent: revisit /cookie-preferences with existing consent', async ({ page }) => {
    await page.goto(BASE_URL)
    await clearConsent(page)
    await page.reload()

    // Accept all first
    const banner = page.locator('[data-system-window-key="cookie-notice"]')
    await expectDrawerOpen(banner)
    await page.getByRole('button', { name: 'Accept All' }).click()
    await expectDrawerClosed(banner)

    const originalConsent = await getConsent(page)
    expect(originalConsent).not.toBeNull()

    // Navigate directly to preferences (already has consent — update flow)
    await page.goto(`${BASE_URL}/cookie-preferences`)
    await expect(page.locator('[data-system-window-key="cookie-preferences"]')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Save Preferences' })).toBeVisible({ timeout: 5000 })

    // All toggles should reflect current consent (all enabled after Accept All)
    const analyticsToggle = page.getByRole('switch', { name: /Toggle Analytics/i })
    await expect(analyticsToggle).toHaveAttribute('aria-checked', 'true')

    // Uncheck analytics
    await analyticsToggle.click()
    await expect(analyticsToggle).toHaveAttribute('aria-checked', 'false')

    await page.getByRole('button', { name: 'Save Preferences' }).click()
    await page.waitForURL(BASE_URL, { timeout: 5000 })

    const updatedConsent = await getConsent(page)
    expect(updatedConsent).not.toBeNull()
    expect(updatedConsent!.categories).not.toContain('analytics')
    expect(updatedConsent!.categories).toContain('essential')
    // A new consentId should have been generated
    expect(updatedConsent!.consentId).not.toBe(originalConsent!.consentId)
  })
})
