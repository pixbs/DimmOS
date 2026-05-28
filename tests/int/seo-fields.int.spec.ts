import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
const createdIds: number[] = []

describe('SEO meta fields on Windows collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const id of createdIds) {
      await payload.delete({ collection: 'windows', id, overrideAccess: true })
    }
  })

  it('creates a window with meta.title and meta.description', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'SEO Test Window',
        slug: 'test-seo-meta-fields',
        meta: {
          title: 'Custom SEO Title',
          description: 'Custom meta description for SEO',
        },
      } as any,
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect((doc as any).meta?.title).toBe('Custom SEO Title')
    expect((doc as any).meta?.description).toBe('Custom meta description for SEO')
  })

  it('creates a window with meta.noIndex: true', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'No Index Window',
        slug: 'test-seo-noindex',
        meta: {
          noIndex: true,
        },
      } as any,
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect((doc as any).meta?.noIndex).toBe(true)
  })

  it('defaults meta.noIndex to false when not specified', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Indexed Window',
        slug: 'test-seo-indexed',
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect((doc as any).meta?.noIndex).toBe(false)
  })

  it('meta fields round-trip through find query', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Round-trip SEO',
        slug: 'test-seo-roundtrip',
        meta: {
          title: 'Round-trip Title',
          description: 'Round-trip description',
          noIndex: false,
        },
      } as any,
      overrideAccess: true,
    })
    createdIds.push(doc.id)

    const { docs } = await payload.find({
      collection: 'windows',
      where: { slug: { equals: 'test-seo-roundtrip' } },
      overrideAccess: true,
    })

    expect(docs.length).toBe(1)
    expect((docs[0] as any).meta?.title).toBe('Round-trip Title')
    expect((docs[0] as any).meta?.description).toBe('Round-trip description')
    expect((docs[0] as any).meta?.noIndex).toBe(false)
  })

  it('blocks unauthenticated read (windows is admin-only)', async () => {
    await expect(
      payload.find({
        collection: 'windows',
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
