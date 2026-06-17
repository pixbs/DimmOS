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

  it('creates a window with a title section block', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Title Window',
        slug: 'test-window-title',
        content: [{ blockType: 'sectionTitle', title: 'Section heading', description: 'Supporting copy' }],
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect(doc.content?.[0]?.blockType).toBe('sectionTitle')
    const titleBlock = doc.content?.[0] as Extract<
      NonNullable<typeof doc.content>[number],
      { blockType: 'sectionTitle' }
    >
    expect(titleBlock.title).toBe('Section heading')
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
    const block = doc.content?.[0] as Extract<
      NonNullable<typeof doc.content>[number],
      { blockType: 'articleList' }
    >
    expect(block.types).toEqual(['case-study'])
    expect(block.sortField).toBe('title')
    expect(block.sortDirection).toBe('asc')
    expect(block.limit).toBe(3)
  })

  it('creates a window with a stats block', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Stats Window',
        slug: 'test-window-stats',
        content: [
          {
            blockType: 'stats',
            stats: [
              { value: 10, suffix: 'Mil', label: 'Downloads' },
              { value: 98, suffix: '%', label: 'Satisfaction' },
            ],
          },
        ],
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect(doc.content?.[0]?.blockType).toBe('stats')
    const stats = doc.content?.[0] as Extract<
      NonNullable<typeof doc.content>[number],
      { blockType: 'stats' }
    >
    expect(stats.stats?.[0]?.value).toBe(10)
    expect(stats.stats?.[0]?.suffix).toBe('Mil')
  })

  it('strips a hero block from a window (Hero is Articles-only)', async () => {
    // Payload silently drops blocks whose type is not in the field's block list,
    // so a window never persists a hero block.
    await payload.delete({
      collection: 'windows',
      where: { slug: { equals: 'test-window-hero' } },
      overrideAccess: true,
    })
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Hero Window',
        slug: 'test-window-hero',
        // @ts-expect-error 'hero' is not part of the Window content block union
        content: [{ blockType: 'hero', title: 'Nope' }],
      },
      overrideAccess: true,
    })
    createdIds.push(doc.id)
    // The only block supplied was the (invalid) hero, so it is dropped entirely.
    expect(doc.content ?? []).toHaveLength(0)
  })

  it('allows unauthenticated read (public content)', async () => {
    const { docs } = await payload.find({
      collection: 'windows',
      where: { slug: { equals: 'test-window-rich-text' } },
      overrideAccess: false,
    })
    expect(docs.length).toBe(1)
  })

  it('blocks unauthenticated create', async () => {
    await expect(
      payload.create({
        collection: 'windows',
        data: { title: 'No Auth', slug: 'test-window-no-auth' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('blocks unauthenticated update and delete', async () => {
    const id = createdIds[0]
    await expect(
      payload.update({ collection: 'windows', id, data: { title: 'Hacked' }, overrideAccess: false }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'windows', id, overrideAccess: false }),
    ).rejects.toThrow()
  })
})
