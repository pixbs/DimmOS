import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
const createdIds: number[] = []

describe('Articles collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const id of createdIds) {
      await payload.delete({ collection: 'articles', id, overrideAccess: true })
    }
  })

  it('creates a case-study article with a richText block', async () => {
    const doc = await payload.create({
      collection: 'articles',
      data: {
        title: 'My Case Study',
        type: 'case-study',
        slug: 'test-case-study',
        content: [
          {
            blockType: 'richText',
            content: {
              root: {
                type: 'root',
                children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Case study content' }] }],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
          },
        ],
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect(doc.type).toBe('case-study')
    expect(doc.content?.[0]?.blockType).toBe('richText')
  })

  it('creates a service article with no content', async () => {
    const doc = await payload.create({
      collection: 'articles',
      data: {
        title: 'My Service',
        type: 'service',
        slug: 'test-service',
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect(doc.type).toBe('service')
  })

  it('filters articles by type', async () => {
    const { docs } = await payload.find({
      collection: 'articles',
      where: { type: { equals: 'case-study' }, slug: { equals: 'test-case-study' } },
      overrideAccess: true,
    })
    expect(docs.length).toBe(1)
    expect(docs[0].type).toBe('case-study')
  })

  it('enforces slug uniqueness', async () => {
    await expect(
      payload.create({
        collection: 'articles',
        data: {
          title: 'Duplicate',
          type: 'service',
          slug: 'test-case-study',
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('blocks unauthenticated read (admin-only)', async () => {
    await expect(
      payload.find({
        collection: 'articles',
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
