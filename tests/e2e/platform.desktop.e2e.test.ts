import type { Page, Route } from '@playwright/test'

import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  E2E_CONSENT_VERSION,
  E2E_ORIGIN,
  E2E_POSTHOG_ORIGIN,
} from '../fixtures/e2e-values'
import { installClientState } from './support'
import { expect, test } from './test'

type StoredConsent = {
  categories: string[]
  consentId: string
  timestamp: number
  version: string
}

async function readConsent(page: Page): Promise<StoredConsent | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('cookie-consent')
    return raw ? JSON.parse(raw) : null
  })
}

async function readPostHogConsent(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies()
  return cookies.find((cookie) => cookie.name === '__ph_opt_in_out_phc_test')?.value ?? null
}

async function authenticateAdmin(page: Page): Promise<void> {
  const status = await page.evaluate(
    async ({ email, password }) => {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      return response.status
    },
    { email: E2E_ADMIN_EMAIL, password: E2E_ADMIN_PASSWORD },
  )
  expect(status).toBe(200)
}

async function expectAuditRecord(
  page: Page,
  consent: StoredConsent,
  expectedCategories: string[],
): Promise<void> {
  const result = await page.evaluate(async (consentId) => {
    const query = new URLSearchParams({
      'where[consentId][equals]': consentId,
      depth: '0',
      limit: '1',
    })
    const response = await fetch(`/api/cookie-consents?${query}`, { credentials: 'include' })
    return {
      body: await response.json(),
      status: response.status,
    }
  }, consent.consentId)

  expect(result.status).toBe(200)
  expect(result.body.docs).toHaveLength(1)
  expect(result.body.docs[0]).toMatchObject({
    categories: expectedCategories,
    consentId: consent.consentId,
    consentVersion: E2E_CONSENT_VERSION,
  })
}

async function mockPostHog(page: Page): Promise<string[]> {
  const requests: string[] = []
  await page.route(`${E2E_POSTHOG_ORIGIN}/**`, async (route) => {
    requests.push(`${route.request().method()} ${route.request().url()}`)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 1, flags: {}, featureFlags: {} }),
    })
  })
  return requests
}

async function loginThroughAdmin(page: Page): Promise<void> {
  await page.goto('/admin')
  await page.getByLabel('Email').fill(E2E_ADMIN_EMAIL)
  await page.getByLabel('Password').fill(E2E_ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Collections', level: 2 })).toBeVisible()
}

test('cookie acceptance persists, records its audit event, and unlocks controlled analytics', async ({ page }) => {
  await installClientState(page, { consentCategories: null })
  const analyticsRequests = await mockPostHog(page)
  await page.goto('/')

  const notice = page.getByRole('dialog', { name: 'Cookie Notice' })
  await expect(notice).toBeVisible()
  expect(analyticsRequests).toEqual([])
  await expect.poll(() => readPostHogConsent(page)).toBe('0')

  const auditResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/cookie-consents/record') &&
      response.request().method() === 'POST',
  )
  await notice.getByRole('button', { name: 'Accept All' }).click()
  expect((await auditResponse).status()).toBe(201)
  await expect(notice).toBeHidden()

  await expect.poll(() => readConsent(page)).toMatchObject({
    categories: ['essential', 'functional', 'analytics', 'marketing'],
    version: E2E_CONSENT_VERSION,
  })
  const stored = await readConsent(page)
  expect(stored).not.toBeNull()
  await expect.poll(() => readPostHogConsent(page)).toBe('1')
  expect(analyticsRequests).toEqual([])

  await authenticateAdmin(page)
  await expectAuditRecord(page, stored!, ['essential', 'functional', 'analytics', 'marketing'])

  await page.reload()
  await expect(notice).toBeHidden()
  await expect.poll(() => readConsent(page)).toEqual(stored)
})

test('cookie rejection and configured updates persist as distinct audited choices', async ({ page }) => {
  await installClientState(page, { consentCategories: null })
  await mockPostHog(page)
  await page.goto('/')

  const notice = page.getByRole('dialog', { name: 'Cookie Notice' })
  await expect(notice).toBeVisible()
  const rejectResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/cookie-consents/record'),
  )
  await notice.getByRole('button', { name: 'Reject' }).click()
  expect((await rejectResponse).status()).toBe(201)
  const rejected = await readConsent(page)
  expect(rejected).toMatchObject({ categories: ['essential'], version: E2E_CONSENT_VERSION })

  await page.evaluate(() => localStorage.removeItem('cookie-consent'))
  await page.reload()
  await expect(notice).toBeVisible()
  await notice.getByRole('button', { name: 'Configure' }).click()

  let preferences = page.getByRole('dialog', { name: 'Cookie Preferences' })
  await expect(preferences).toBeVisible()
  await preferences.getByRole('button', { name: /Analytics$/ }).click()
  await preferences.getByRole('button', { name: /E2E Analytics$/ }).click()
  await expect(preferences.getByText('ph_e2e')).toBeVisible()
  await preferences.getByRole('switch', { name: 'Toggle Analytics' }).click()

  const configuredResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/cookie-consents/record'),
  )
  await preferences.getByRole('button', { name: 'Save Preferences' }).click()
  expect((await configuredResponse).status()).toBe(201)
  const configured = await readConsent(page)
  expect(configured).toMatchObject({
    categories: ['essential', 'analytics'],
    version: E2E_CONSENT_VERSION,
  })

  await page.goto('/cookie-preferences')
  preferences = page.getByRole('dialog', { name: 'Cookie Preferences' })
  await expect(preferences.getByRole('switch', { name: 'Toggle Analytics' })).toBeChecked()
  await preferences.getByRole('switch', { name: 'Toggle Analytics' }).click()
  await preferences.getByRole('switch', { name: 'Toggle Functional' }).click()

  const updateResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/cookie-consents/record'),
  )
  await preferences.getByRole('button', { name: 'Save Preferences' }).click()
  expect((await updateResponse).status()).toBe(201)
  const updated = await readConsent(page)
  expect(updated).toMatchObject({
    categories: ['essential', 'functional'],
    version: E2E_CONSENT_VERSION,
  })
  expect(updated?.consentId).not.toBe(configured?.consentId)

  await authenticateAdmin(page)
  await expectAuditRecord(page, rejected!, ['essential'])
  await expectAuditRecord(page, configured!, ['essential', 'analytics'])
  await expectAuditRecord(page, updated!, ['essential', 'functional'])
})

test('contact submission exposes controlled failure and success states without third-party traffic', async ({
  page,
  testGuardrails,
}) => {
  testGuardrails.allowBrowserMessage(/status of 503 \(Service Unavailable\)/)
  await installClientState(page)
  await page.addInitScript(() => {
    window.grecaptcha = {
      ready: (callback) => callback(),
      execute: async () => 'controlled-recaptcha-token',
    }
  })
  await page.route('https://www.google.com/recaptcha/api.js?**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  })

  const submissions: Array<Record<string, unknown>> = []
  let attempt = 0
  await page.route('**/api/form-submissions', async (route: Route) => {
    attempt += 1
    submissions.push(route.request().postDataJSON())
    await route.fulfill({
      status: attempt === 1 ? 503 : 201,
      contentType: 'application/json',
      body: JSON.stringify(attempt === 1 ? { errors: [{ message: 'Controlled failure' }] } : { id: 1 }),
    })
  })

  await page.goto('/')
  await page.getByRole('link', { name: 'Contact' }).click()
  const contact = page.getByRole('dialog', { name: 'E2E Contact' })
  await contact.getByPlaceholder('Your name').fill('Ada Lovelace')
  await contact.getByPlaceholder('Describe your project').fill('Build a deterministic platform.')
  await expect(contact.getByText('owner@example.test')).toBeVisible()

  await contact.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(contact.getByText('Something went wrong. Please try again.')).toBeVisible()
  await contact.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(contact.getByRole('button', { name: 'Sent!', exact: true })).toBeDisabled()

  expect(submissions).toHaveLength(2)
  expect(submissions[1]).toMatchObject({
    submissionData: expect.arrayContaining([
      { field: 'name', value: 'Ada Lovelace' },
      { field: 'email', value: 'owner@example.test' },
      { field: 'message', value: 'Build a deterministic platform.' },
      { field: 'recaptchaToken', value: 'controlled-recaptcha-token' },
    ]),
  })
})

test('search metadata, discovery files, fallback images, and preview rendering agree', async ({ page }) => {
  await installClientState(page)
  const request = page.context().request
  const sitemapResponse = await request.get(`${E2E_ORIGIN}/sitemap.xml`)
  expect(sitemapResponse.status()).toBe(200)
  const sitemap = await sitemapResponse.text()
  expect(sitemap).toContain(`${E2E_ORIGIN}/e2e-alpha`)
  expect(sitemap).not.toContain(`${E2E_ORIGIN}/e2e-private`)

  const robotsResponse = await request.get(`${E2E_ORIGIN}/robots.txt`)
  expect(robotsResponse.status()).toBe(200)
  const robots = await robotsResponse.text()
  expect(robots).toContain('Disallow: /admin')
  expect(robots).toContain(`Sitemap: ${E2E_ORIGIN}/sitemap.xml`)

  await page.goto('/e2e-alpha')
  await expect(page).toHaveTitle('Alpha Project | DimmOS')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${E2E_ORIGIN}/e2e-alpha`,
  )
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${E2E_ORIGIN}/og/e2e-alpha`,
  )

  await page.goto('/e2e-private')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.getByRole('heading', { name: 'Private delivery' })).toBeVisible()

  const articleResponse = await request.get(
    `${E2E_ORIGIN}/api/articles?where[slug][equals]=e2e-alpha&depth=0&limit=1`,
  )
  expect(articleResponse.status()).toBe(200)
  const articleBody = await articleResponse.json()
  expect(articleBody.docs).toHaveLength(1)
  const articleId = articleBody.docs[0].id as number

  const ogResponse = await request.get(`${E2E_ORIGIN}/og/e2e-alpha`)
  expect(ogResponse.status()).toBe(200)
  expect(ogResponse.headers()['content-type']).toContain('image/png')
  expect((await ogResponse.body()).byteLength).toBeGreaterThan(1_000)

  await page.goto(`/seo-preview/articles/${articleId}`)
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByText('Alpha Project', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Alpha delivery' })).toBeVisible()
})

test('admin login supports controlled AI feedback and authenticated content CRUD', async ({
  page,
  testGuardrails,
}) => {
  testGuardrails.allowBrowserMessage(/status of 502 \(Bad Gateway\)/)
  await page.route('https://www.gravatar.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+Xw3qWQAAAABJRU5ErkJggg==',
        'base64',
      ),
    })
  })
  await loginThroughAdmin(page)

  let aiAttempt = 0
  await page.route('**/api/ai/generate-field', async (route) => {
    aiAttempt += 1
    await route.fulfill({
      status: aiAttempt === 1 ? 200 : 502,
      contentType: 'application/json',
      body: JSON.stringify(
        aiAttempt === 1
          ? { result: 'Generated Admin Window' }
          : { errors: [{ message: 'Controlled AI failure' }] },
      ),
    })
  })

  await page.goto('/admin/collections/windows/create')
  const title = page.getByRole('textbox', { name: 'Title *', exact: true })
  const slug = page.getByRole('textbox', { name: 'Slug *', exact: true })
  const generate = page.getByRole('button', { name: 'Generate field content' }).first()

  await generate.click()
  await expect(title).toHaveValue('Generated Admin Window')
  await generate.click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Controlled AI failure')

  await title.fill('E2E Admin Window')
  await slug.fill('e2e-admin-window')
  const createResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/windows' &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const createdResponse = await createResponse
  expect(createdResponse.status()).toBe(201)
  const createdBody = await createdResponse.json()
  const createdId = (createdBody.doc?.id ?? createdBody.id) as number
  expect(createdId).toEqual(expect.any(Number))
  await expect(page).toHaveURL(new RegExp(`/admin/collections/windows/${createdId}$`))

  await title.fill('Updated E2E Admin Window')
  const save = page.getByRole('button', { name: 'Save', exact: true })
  await expect(save).toBeEnabled()
  const updateResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `/api/windows/${createdId}` &&
      response.request().method() === 'PATCH',
  )
  await save.click()
  expect((await updateResponse).status()).toBe(200)

  const deleted = await page.evaluate(async (id) => {
    const response = await fetch(`/api/windows/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    return response.status
  }, createdId)
  expect(deleted).toBe(200)

  const missing = await requestWindow(page, createdId)
  expect(missing).toBe(404)
})

async function requestWindow(page: Page, id: number): Promise<number> {
  const response = await page.context().request.get(`${E2E_ORIGIN}/api/windows/${id}`)
  return response.status()
}
