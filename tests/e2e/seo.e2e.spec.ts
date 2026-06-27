import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../../src/payload.config.js'
import { cleanupWindow, seedWindow } from '../helpers/seedContent'

const BASE_URL = 'http://localhost:3000'
const NO_INDEX_SLUG = 'e2e-seo-noindex-test'
const FALLBACK_OG_SLUG = 'e2e-seo-fallback-og'

async function expectNonBlankPng(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata()
  expect(metadata.width).toBe(1200)
  expect(metadata.height).toBe(630)

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

test.describe('SEO', () => {
  test.beforeAll(async () => {
    const payload = await getPayload({ config })
    await payload.delete({
      collection: 'windows',
      where: { slug: { equals: NO_INDEX_SLUG } },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'windows',
      overrideAccess: true,
      data: {
        title: 'No Index Test Page',
        slug: NO_INDEX_SLUG,
        meta: { noIndex: true },
      } as any,
    })
    await seedWindow(FALLBACK_OG_SLUG)
  })

  test.afterAll(async () => {
    const payload = await getPayload({ config })
    await payload.delete({
      collection: 'windows',
      where: { slug: { equals: NO_INDEX_SLUG } },
      overrideAccess: true,
    })
    await cleanupWindow(FALLBACK_OG_SLUG)
  })

  test('GET /sitemap.xml returns 200 with XML content', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`)
    expect(response.status()).toBe(200)
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('xml')
    const body = await response.text()
    expect(body).toContain('<urlset')
    expect(body).toContain('<url>')
  })

  test('sitemap.xml contains at least one URL entry', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`)
    const body = await response.text()
    const urlCount = (body.match(/<loc>/g) ?? []).length
    expect(urlCount).toBeGreaterThanOrEqual(1)
  })

  test('GET /robots.txt returns 200 and disallows /admin', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`)
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('Disallow: /admin')
  })

  test('homepage has og:title meta tag', async ({ page }) => {
    await page.goto(BASE_URL)
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveCount(1)
    const content = await ogTitle.getAttribute('content')
    expect(content).toBeTruthy()
  })

  test('page with meta.noIndex: true has robots noindex tag', async ({ page }) => {
    await page.goto(`${BASE_URL}/${NO_INDEX_SLUG}`)
    const robotsMeta = page.locator('meta[name="robots"]')
    const content = await robotsMeta.getAttribute('content')
    expect(content).toContain('noindex')
  })

  test('document page has a canonical link ending in its slug', async ({ page }) => {
    await page.goto(`${BASE_URL}/${NO_INDEX_SLUG}`)
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveCount(1)
    const href = await canonical.getAttribute('href')
    expect(href).toMatch(new RegExp(`/${NO_INDEX_SLUG}$`))
  })

  test('fallback OG route returns a nonblank 1200x630 PNG', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/og/${FALLBACK_OG_SLUG}`)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')

    await expectNonBlankPng(await response.body())
  })

  test('document without meta.image points og:image at the fallback route', async ({ page }) => {
    await page.goto(`${BASE_URL}/${FALLBACK_OG_SLUG}`)
    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveCount(1)

    const content = await ogImage.getAttribute('content')
    expect(new URL(content ?? '', BASE_URL).pathname).toBe(`/og/${FALLBACK_OG_SLUG}`)
  })
})
