import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { cookieManifest } from '@/data/cookieManifest'
import { seedCookieServices, cleanupCookieServices } from '../helpers/seedCookieServices'

let payload: Payload

describe('Cookie manifest', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await cleanupCookieServices()
    await seedCookieServices()
  })

  afterAll(async () => {
    await cleanupCookieServices()
  })

  it('seeds exactly the manifest entries', async () => {
    const result = await payload.find({
      collection: 'cookie-services',
      where: { name: { in: cookieManifest.map((s) => s.name) } },
      overrideAccess: true,
      limit: 100,
    })
    expect(result.docs).toHaveLength(cookieManifest.length)
  })

  it('all seeded entries are publicly readable', async () => {
    const result = await payload.find({
      collection: 'cookie-services',
      where: { name: { in: cookieManifest.map((s) => s.name) } },
      overrideAccess: false,
      limit: 100,
    })
    expect(result.docs).toHaveLength(cookieManifest.length)
  })

  it('essential category entries are present (consent + reCAPTCHA)', async () => {
    const result = await payload.find({
      collection: 'cookie-services',
      where: { category: { equals: 'essential' } },
      overrideAccess: false,
      limit: 100,
    })
    const names = result.docs.map((d) => d.name)
    expect(names).toContain('Cookie Consent')
    expect(names).toContain('reCAPTCHA')
  })

  it('analytics category entry is present (PostHog)', async () => {
    const result = await payload.find({
      collection: 'cookie-services',
      where: { category: { equals: 'analytics' } },
      overrideAccess: false,
      limit: 100,
    })
    expect(result.docs.map((d) => d.name)).toContain('PostHog Analytics')
  })

  it('functional category entries are present (Window Positions + Sentry)', async () => {
    const result = await payload.find({
      collection: 'cookie-services',
      where: { category: { equals: 'functional' } },
      overrideAccess: false,
      limit: 100,
    })
    const names = result.docs.map((d) => d.name)
    expect(names).toContain('Window Positions')
    expect(names).toContain('Sentry Error Tracking')
  })

  it('cookies arrays round-trip correctly', async () => {
    const result = await payload.find({
      collection: 'cookie-services',
      where: { name: { equals: 'PostHog Analytics' } },
      overrideAccess: false,
      limit: 1,
    })
    const posthog = result.docs[0]
    expect(posthog?.cookies).toHaveLength(3)
    expect(posthog?.cookies?.[0]?.storageType).toBe('localStorage')
    expect(posthog?.cookies?.[0]?.name).toBe('ph_*')
    expect(posthog?.cookies?.[1]?.storageType).toBe('localStorage')
    expect(posthog?.cookies?.[1]?.name).toBe('__ph_*')
    expect(posthog?.cookies?.[2]?.storageType).toBe('cookie')
  })
})
