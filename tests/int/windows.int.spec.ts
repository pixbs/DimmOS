import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
const createdIds: number[] = []

describe('Windows collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const id of createdIds) {
      await payload.delete({ collection: 'windows', id, overrideAccess: true })
    }
  })

  it('creates a window with a richText block', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Test Window',
        slug: 'test-window-rich-text',
        content: [
          {
            blockType: 'richText',
            content: {
              root: {
                type: 'root',
                children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Hello' }] }],
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
    expect(doc.content).toHaveLength(1)
    expect(doc.content?.[0]?.blockType).toBe('richText')
  })

  it('creates a window with no content (optional field)', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Empty Window',
        slug: 'test-window-empty',
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect(doc.title).toBe('Empty Window')
    expect(doc.content == null || doc.content.length === 0).toBe(true)
  })

  it('creates a window with a CTA block', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'CTA Window',
        slug: 'test-window-cta',
        content: [
          {
            blockType: 'cta',
            heading: 'Get in touch',
            body: 'Send me a message',
            link: { label: 'Contact', href: '/contact', openInNewTab: false },
          },
        ],
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect(doc.content?.[0]?.blockType).toBe('cta')
    const cta = doc.content?.[0] as Extract<typeof doc.content[number], { blockType: 'cta' }>
    expect(cta.heading).toBe('Get in touch')
  })

  it('fetches window by slug', async () => {
    const { docs } = await payload.find({
      collection: 'windows',
      where: { slug: { equals: 'test-window-rich-text' } },
      overrideAccess: true,
    })
    expect(docs.length).toBe(1)
    expect(docs[0].slug).toBe('test-window-rich-text')
  })

  it('creates a window with an articleList block', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Article List Window',
        slug: 'test-window-article-list',
        content: [
          {
            blockType: 'articleList',
            types: ['case-study'],
            sortField: 'title',
            sortDirection: 'asc',
            limit: 3,
          },
        ],
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect(doc.content?.[0]?.blockType).toBe('articleList')
    const block = doc.content?.[0] as Extract<typeof doc.content[number], { blockType: 'articleList' }>
    expect(block.types).toEqual(['case-study'])
    expect(block.sortField).toBe('title')
    expect(block.sortDirection).toBe('asc')
    expect(block.limit).toBe(3)
  })

  it('rejects an embed block with a non-http(s) URL', async () => {
    await expect(
      payload.create({
        collection: 'windows',
        data: {
          title: 'Bad Embed Window',
          slug: 'test-window-bad-embed',
          content: [{ blockType: 'embed', url: 'javascript:alert(1)' }],
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('creates a window with an https embed block', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Embed Window',
        slug: 'test-window-embed',
        content: [{ blockType: 'embed', url: 'https://example.com/video' }],
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect(doc.content?.[0]?.blockType).toBe('embed')
  })

  it('blocks unauthenticated read (admin-only)', async () => {
    await expect(
      payload.find({
        collection: 'windows',
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
