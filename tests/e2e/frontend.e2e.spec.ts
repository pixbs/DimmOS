import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Frontend', () => {
  test('homepage has correct title and loads', async ({ page }) => {
    await page.goto(BASE_URL)

    await expect(page).toHaveTitle(/Dimm's OS/)
    await expect(page).toHaveURL(BASE_URL)
  })
})
