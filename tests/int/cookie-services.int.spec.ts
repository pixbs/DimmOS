import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
let createdServiceId: number

describe('CookieServices collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    if (createdServiceId) {
      await payload.delete({ collection: 'cookie-services', id: createdServiceId, overrideAccess: true })
    }
  })

  it('creates a service with all fields including cookies array', async () => {
    const doc = await payload.create({
      collection: 'cookie-services',
      data: {
        name: 'Test Analytics Service',
        category: 'analytics',
        description: 'A test analytics service',
        legalName: 'Test Corp LLC',
        privacyPolicyUrl: 'https://example.com/privacy',
        cookies: [
          {
            storageType: 'cookie',
            name: '_test_ga',
            duration: '2 years',
            description: 'Tracks page views',
          },
          {
            storageType: 'localStorage',
            name: '_test_session',
            duration: 'Session',
            description: 'Session identifier',
          },
        ],
      },
      overrideAccess: true,
    })

    createdServiceId = doc.id
    expect(doc.name).toBe('Test Analytics Service')
    expect(doc.category).toBe('analytics')
    expect(doc.legalName).toBe('Test Corp LLC')
    expect(doc.cookies).toHaveLength(2)
    expect(doc.cookies?.[0]?.name).toBe('_test_ga')
    expect(doc.cookies?.[0]?.storageType).toBe('cookie')
    expect(doc.cookies?.[1]?.storageType).toBe('localStorage')
  })

  it('allows public read access without authentication', async () => {
    const result = await payload.find({
      collection: 'cookie-services',
      overrideAccess: false,
    })
    expect(result).toBeDefined()
    expect(Array.isArray(result.docs)).toBe(true)
  })

  it('blocks unauthenticated create (admin-only write)', async () => {
    await expect(
      payload.create({
        collection: 'cookie-services',
        data: { name: 'Unauthorized', category: 'analytics' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
