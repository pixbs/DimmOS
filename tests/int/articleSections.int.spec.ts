import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload

const ARTICLE_SLUGS = ['sections-int', 'hero-only-int']
const TAG_SLUGS = ['branding-int', 'web-int', 'no-auth-int']

/** Idempotent wipe by slug so reruns (and aborted runs) never collide on unique slugs. */
async function wipe() {
  await payload.delete({ collection: 'articles', where: { slug: { in: ARTICLE_SLUGS } }, overrideAccess: true })
  await payload.delete({ collection: 'tags', where: { slug: { in: TAG_SLUGS } }, overrideAccess: true })
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  await wipe()
})

afterAll(async () => {
  await wipe()
})

describe('Tags collection', () => {
  it('creates a tag and allows public (unauthenticated) read', async () => {
    await payload.create({
      collection: 'tags',
      data: { title: 'Branding', slug: 'branding-int' },
      overrideAccess: true,
    })

    const { docs } = await payload.find({
      collection: 'tags',
      where: { slug: { equals: 'branding-int' } },
      overrideAccess: false,
    })
    expect(docs).toHaveLength(1)
    expect(docs[0].title).toBe('Branding')
  })

  it('blocks unauthenticated tag creation', async () => {
    await expect(
      payload.create({
        collection: 'tags',
        data: { title: 'NoAuth', slug: 'no-auth-int' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})

describe('Article sections + article-only fields', () => {
  it('creates an article with year, tags, and every (media-free) section block', async () => {
    const tag = await payload.create({
      collection: 'tags',
      data: { title: 'Web', slug: 'web-int' },
      overrideAccess: true,
    })

    const doc = await payload.create({
      collection: 'articles',
      overrideAccess: true,
      data: {
        title: 'Sections Case Study',
        type: 'case-study',
        slug: 'sections-int',
        year: 2026,
        tags: [tag.id],
        content: [
          { blockType: 'hero', title: 'Hero title', description: 'Hero copy' },
          { blockType: 'summary', leftTitle: 'L', leftBody: 'lb', rightTitle: 'R', rightBody: 'rb' },
          { blockType: 'stats', stats: [{ value: 10, suffix: 'Mil', label: 'Users' }] },
          { blockType: 'description', title: 'Big title' },
          { blockType: 'sectionTitle', title: 'A title', description: 'desc' },
        ],
      },
    })

    expect(doc.year).toBe(2026)
    expect(doc.tags?.length).toBe(1)
    expect(doc.content?.map((b) => b.blockType)).toEqual([
      'hero',
      'summary',
      'stats',
      'description',
      'sectionTitle',
    ])
  })

  it('accepts the Hero block on an Article (Articles-only block)', async () => {
    const doc = await payload.create({
      collection: 'articles',
      overrideAccess: true,
      data: {
        title: 'Hero Only',
        type: 'case-study',
        slug: 'hero-only-int',
        content: [{ blockType: 'hero', title: 'Just a hero' }],
      },
    })
    expect(doc.content?.[0]?.blockType).toBe('hero')
  })
})
