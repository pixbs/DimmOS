import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE_URL = 'http://localhost:3000'
const NO_INDEX_SLUG = 'e2e-seo-noindex-test'

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
  })

  test.afterAll(async () => {
    const payload = await getPayload({ config })
    await payload.delete({
      collection: 'windows',
      where: { slug: { equals: NO_INDEX_SLUG } },
      overrideAccess: true,
    })
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
})
