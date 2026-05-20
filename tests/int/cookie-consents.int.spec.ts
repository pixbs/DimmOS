import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { captureRequestMetadataHook } from '@/hooks/cookies/captureRequestMetadata'

let payload: Payload
const createdIds: number[] = []

describe('CookieConsents collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const id of createdIds) {
      await payload.delete({ collection: 'cookie-consents', id, overrideAccess: true })
    }
  })

  it('captureRequestMetadataHook extracts IP and user-agent on create', async () => {
    const mockReq = {
      headers: {
        get: (name: string) => {
          const map: Record<string, string> = {
            'cf-connecting-ip': '1.2.3.4',
            'user-agent': 'Mozilla/5.0 TestBrowser',
          }
          return map[name] ?? null
        },
      },
    }

    const result = await captureRequestMetadataHook({
      data: { consentId: 'test-id', categories: ['essential'] },
      req: mockReq as any,
      operation: 'create',
      collection: null as any,
    })

    expect(result.ipAddress).toBe('1.2.3.4')
    expect(result.userAgent).toBe('Mozilla/5.0 TestBrowser')
  })

  it('captureRequestMetadataHook does nothing on update', async () => {
    const mockReq = {
      headers: { get: () => '9.9.9.9' },
    }

    const result = await captureRequestMetadataHook({
      data: { consentId: 'test-id', categories: ['essential'] },
      req: mockReq as any,
      operation: 'update',
      collection: null as any,
    })

    // Should return data unchanged on update
    expect((result as any).ipAddress).toBeUndefined()
  })

  it('creates a consent record via overrideAccess (simulates endpoint)', async () => {
    const consentId = crypto.randomUUID()
    const doc = await payload.create({
      collection: 'cookie-consents',
      data: {
        consentId,
        categories: ['essential', 'analytics'],
        language: 'en-US',
        consentVersion: '1.0',
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect(doc.consentId).toBe(consentId)
    expect(doc.categories).toContain('essential')
    expect(doc.categories).toContain('analytics')
    expect(doc.consentVersion).toBe('1.0')
    expect(doc.language).toBe('en-US')
  })

  it('blocks direct create without overrideAccess', async () => {
    await expect(
      payload.create({
        collection: 'cookie-consents',
        data: {
          consentId: crypto.randomUUID(),
          categories: ['essential'],
        },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('enforces unique consentId constraint', async () => {
    const consentId = crypto.randomUUID()
    const first = await payload.create({
      collection: 'cookie-consents',
      data: { consentId, categories: ['essential'] },
      overrideAccess: true,
    })
    createdIds.push(first.id)

    await expect(
      payload.create({
        collection: 'cookie-consents',
        data: { consentId, categories: ['essential'] },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })
})
