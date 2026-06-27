import { expect, test } from '@playwright/test'
import sharp from 'sharp'
import { cleanupWindow, seedWindow } from '../helpers/seedContent'

const BASE_URL = 'http://localhost:3000'
const SLUG = 'e2e-seo-preview-window'

async function expectNonBlankImage(buffer: Buffer) {
  const { data } = await sharp(buffer)
    .resize(24, 13, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const first = data.subarray(0, 4).join(',')
  let differentPixels = 0
  for (let i = 4; i < data.length; i += 4) {
    if (data.subarray(i, i + 4).join(',') !== first) differentPixels += 1
  }

  expect(differentPixels).toBeGreaterThan(20)
}

test.describe('SEO preview route', () => {
  test.afterEach(async () => {
    await cleanupWindow(SLUG)
  })

  test('renders a nonblank fixed-size window preview', async ({ page }) => {
    const doc = await seedWindow(SLUG)

    await page.setViewportSize({ width: 1200, height: 630 })
    await page.goto(`${BASE_URL}/seo-preview/windows/${doc.id}`)

    const panel = page.locator('[data-seo-preview-window]')
    await expect(panel).toBeVisible()
    await expect(panel).toHaveAttribute('data-state', 'open')

    await expectNonBlankImage(await page.screenshot({ fullPage: false }))
  })
})
