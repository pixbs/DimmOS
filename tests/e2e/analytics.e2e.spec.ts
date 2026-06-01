import { test, expect } from '@playwright/test'
import { seedCookieServices, cleanupCookieServices } from '../helpers/seedCookieServices'
import { cookieManifest } from '../../src/data/cookieManifest'

const BASE_URL = 'http://localhost:3000'

// PostHog consent tests require a real API key — skip in environments where it isn't configured
const POSTHOG_CONFIGURED =
  !!process.env.NEXT_PUBLIC_POSTHOG_KEY &&
  !process.env.NEXT_PUBLIC_POSTHOG_KEY.includes('...')

function seedConsent(categories: string[]) {
  return async ({ page }: { page: import('@playwright/test').Page }) => {
    await page.addInitScript((cats) => {
      localStorage.setItem('cookie-consent', JSON.stringify({
        consentId: 'e2e-analytics-test',
        categories: cats,
        timestamp: Date.now(),
        version: '1.0',
      }))
    }, categories)
  }
}

test.describe('Analytics — consent gating', () => {
  test.beforeAll(async () => {
    try {
      await cleanupCookieServices()
      await seedCookieServices()
    } catch (e) {
      console.warn('Cookie services seed failed — tests may see stale or missing data:', e)
    }
  })

  test.afterAll(async () => {
    try {
      await cleanupCookieServices()
    } catch {
      // best-effort; beforeAll re-cleans on the next run
    }
  })

  test.describe('PostHog — analytics consent', () => {
    test('opted IN after analytics consent accepted', async ({ page }) => {
      test.skip(!POSTHOG_CONFIGURED, 'NEXT_PUBLIC_POSTHOG_KEY not configured')
      await seedConsent(['essential', 'analytics', 'functional', 'marketing'])({ page })
      await page.goto(BASE_URL)
      // posthog-js (ES module) does not set window.posthog; verify via its side-effect:
      // opt_in_capturing() causes posthog to write ph_* persistence data to localStorage
      await page.waitForFunction(
        () => Object.keys(localStorage).some((k) => k.startsWith('ph_')),
        { timeout: 10000 },
      )
      const hasPostHogData = await page.evaluate(() =>
        Object.keys(localStorage).some((k) => k.startsWith('ph_')),
      )
      expect(hasPostHogData).toBe(true)
    })

    test('opted OUT when only essential consent given', async ({ page }) => {
      test.skip(!POSTHOG_CONFIGURED, 'NEXT_PUBLIC_POSTHOG_KEY not configured')
      await seedConsent(['essential'])({ page })
      await page.goto(BASE_URL)
      // opt_out_capturing_by_default + opt_out_persistence_by_default means no ph_* data
      // is written to localStorage when PostHog is opted out — check absence after settle
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      const hasPostHogData = await page.evaluate(() =>
        Object.keys(localStorage).some((k) => k.startsWith('ph_')),
      )
      expect(hasPostHogData).toBe(false)
    })
  })

  test.describe('Cookie audit — no undeclared storage', () => {
    test('all browser cookies and storage keys are declared in manifest', async ({ page }) => {
      await seedConsent(['essential', 'analytics', 'functional', 'marketing'])({ page })
      await page.goto(BASE_URL)

      // Wait for React to hydrate and all useEffect hooks to fire
      await page.waitForLoadState('networkidle')
      // Give PostHog (if configured) a moment to write persistence data after opting in
      await page.waitForTimeout(500)

      // Collect all browser storage keys
      const collected = await page.evaluate(() => {
        const cookieNames = document.cookie
          .split(';')
          .map((c) => c.trim().split('=')[0])
          .filter(Boolean)

        const lsKeys = Object.keys(localStorage)
        const ssKeys = Object.keys(sessionStorage)

        return [...cookieNames, ...lsKeys, ...ssKeys]
      })

      // Fetch declared services from the API
      const response = await page.request.get(
        `${BASE_URL}/api/cookie-services?limit=100&depth=1`,
      )
      const json = await response.json()
      const services = json.docs as Array<{ cookies?: Array<{ name?: string }> }>

      // Flatten declared names; entries ending with '*' become prefix patterns
      const declaredNames: string[] = services.flatMap(
        (s) => (s.cookies ?? []).map((c) => c.name ?? '').filter(Boolean),
      )

      const isAllowed = (key: string) =>
        declaredNames.some((declared) => {
          if (declared.endsWith('*')) {
            return key.startsWith(declared.slice(0, -1))
          }
          return key === declared
        })

      const undeclared = collected.filter((key) => !isAllowed(key))

      expect(
        undeclared,
        `Undeclared cookies/storage keys found. Add them to src/data/cookieManifest.ts: ${undeclared.join(', ')}`,
      ).toHaveLength(0)
    })
  })

  test.describe('Cookie services API', () => {
    test('all manifest services are visible from the public API', async ({ page }) => {
      const response = await page.request.get(
        `${BASE_URL}/api/cookie-services?limit=100&depth=0`,
      )
      expect(response.ok()).toBe(true)
      const json = await response.json()
      const names: string[] = json.docs.map((d: { name: string }) => d.name)

      for (const entry of cookieManifest) {
        expect(names, `Missing manifest entry: ${entry.name}`).toContain(entry.name)
      }
    })
  })
})
