import type { ArticleListBlock } from '@/payload-types'
import { fetchArticleList } from '@/lib/articleList'
import { generateSeoMetaImage } from '@/lib/seo-image/generation'
import { fetchAllShortcutContents, fetchWindowContent } from '@/lib/windowContent'
import { createGeneratedMetaImageHooks } from '@/hooks/seo/generated-meta-image'
import { createLocalReq } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { getTestPayload, lexicalDocument, trackDocument, uniqueValue } from '../fixtures/payload'
import { cacheCalls, resetCacheCalls } from '../stubs/node-next-cache'
import { drainAfterTasks } from '../stubs/node-next-server'

describe('content resolution', () => {
  it('resolves public window, article, form, article-list, and missing content contracts', async () => {
    const payload = await getTestPayload()
    const tag = await payload.create({
      collection: 'tags',
      data: { title: 'Resolution tag', slug: uniqueValue('resolution-tag') },
      overrideAccess: true,
    })
    await trackDocument('tags', tag.id)
    const articleSlug = uniqueValue('resolved-article')
    const article = await payload.create({
      collection: 'articles',
      data: {
        title: 'Resolved article',
        type: 'case-study',
        slug: articleSlug,
        year: 2025,
        tags: [tag.id],
        content: [{ blockType: 'hero', title: 'Resolved hero' }],
      },
      overrideAccess: true,
    })
    await trackDocument('articles', article.id)
    const windowSlug = uniqueValue('resolved-window')
    const window = await payload.create({
      collection: 'windows',
      data: {
        title: 'Resolved window',
        slug: windowSlug,
        windowDisplaySearch: true,
        windowDisplayViewToggle: true,
        content: [
          {
            blockType: 'articleList',
            heading: 'Selected work',
            types: ['case-study'],
            sortField: 'title',
            sortDirection: 'asc',
            limit: 50,
          },
        ],
      },
      overrideAccess: true,
    })
    await trackDocument('windows', window.id)
    const formSlug = uniqueValue('resolved-form')
    const form = await payload.create({
      collection: 'forms',
      data: {
        title: 'Resolved form',
        slug: formSlug,
        confirmationMessage: lexicalDocument('Resolved confirmation.'),
      },
      overrideAccess: true,
    })
    await trackDocument('forms', form.id)

    const resolvedWindow = await fetchWindowContent(windowSlug)
    expect(resolvedWindow).toMatchObject({
      type: 'window',
      title: 'Resolved window',
      behavior: { displaySearch: true, displayViewToggle: true },
    })
    expect(resolvedWindow?.type === 'window' ? resolvedWindow.blocks[0] : null).toMatchObject({
      blockType: 'articleList',
      heading: 'Selected work',
      articles: expect.arrayContaining([
        expect.objectContaining({
          slug: articleSlug,
          year: 2025,
          tags: ['Resolution tag'],
        }),
      ]),
    })

    const block = window.content?.[0] as ArticleListBlock
    const list = await fetchArticleList(block, payload)
    expect(list.find((item) => item.slug === articleSlug)).toMatchObject({
      title: 'Resolved article',
      tags: ['Resolution tag'],
      bgImage: null,
      fgImage: null,
    })
    const defaultList = await fetchArticleList(
      {
        blockType: 'articleList',
        types: [],
        sortField: null,
        sortDirection: 'desc',
        limit: null,
      } as ArticleListBlock,
      payload,
    )
    expect(defaultList.some((item) => item.slug === articleSlug)).toBe(true)

    const resolved = await fetchAllShortcutContents([
      articleSlug,
      formSlug,
      uniqueValue('missing-content'),
    ])
    expect(resolved[articleSlug]).toMatchObject({ type: 'article' })
    expect(resolved[formSlug]).toMatchObject({ type: 'form' })
    expect(Object.values(resolved)).toContain(null)
  })
})

describe('revalidation hooks', () => {
  it('invalidates the shared tag and authored paths after create, update, and delete', async () => {
    const payload = await getTestPayload()
    const slug = uniqueValue('revalidation')
    resetCacheCalls()

    const window = await payload.create({
      collection: 'windows',
      data: { title: 'Revalidation contract', slug },
      overrideAccess: true,
    })
    expect(cacheCalls.tags).toContainEqual(['window-content', {}])
    expect(cacheCalls.paths).toContainEqual([`/${slug}`])
    expect(cacheCalls.paths).toContainEqual(['/'])

    resetCacheCalls()
    await payload.update({
      collection: 'windows',
      id: window.id,
      data: { title: 'Updated revalidation contract' },
      overrideAccess: true,
    })
    expect(cacheCalls.paths).toContainEqual([`/${slug}`])

    resetCacheCalls()
    await payload.delete({ collection: 'windows', id: window.id, overrideAccess: true })
    expect(cacheCalls.paths).toContainEqual([`/${slug}`])
    expect(cacheCalls.paths).toContainEqual(['/'])
  })
})

describe('generated SEO media', () => {
  it('schedules generated-image work and reports controlled background failures', async () => {
    const hooks = createGeneratedMetaImageHooks('windows')
    const previousDisabled = process.env.SEO_IMAGE_GENERATION_DISABLED
    process.env.SEO_IMAGE_GENERATION_DISABLED = 'false'
    const logger = { error: vi.fn() }
    const payload = {
      findByID: vi.fn(async () => ({ id: 9, alt: 'Manual image' })),
      find: vi.fn(async () => ({ docs: [] })),
      delete: vi.fn(async () => ({})),
      logger,
    }
    const doc = { id: 22, title: 'Scheduled SEO', meta: { image: 9 } }

    try {
      const returned = await hooks.afterChange[0]?.({
        doc,
        req: { context: {}, payload },
      } as never)
      expect(returned).toBe(doc)
      await drainAfterTasks()
      expect(payload.findByID).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'media', id: 9 }),
      )
      expect(logger.error).not.toHaveBeenCalled()

      payload.find.mockRejectedValueOnce(new Error('controlled cleanup failure'))
      await hooks.afterChange[0]?.({ doc, req: { context: {}, payload } } as never)
      await drainAfterTasks()
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
          msg: 'Failed to generate SEO meta image for windows:22',
        }),
      )
    } finally {
      process.env.SEO_IMAGE_GENERATION_DISABLED = previousDisabled
    }
  })

  it('captures a controlled preview, stores its provenance, and links it to the source document', async () => {
    const payload = await getTestPayload()
    const window = await payload.create({
      collection: 'windows',
      data: {
        title: 'SEO integration source',
        slug: uniqueValue('seo-source'),
        meta: { title: 'SEO preview title' },
      },
      overrideAccess: true,
    })
    await trackDocument('windows', window.id)
    const req = await createLocalReq(
      {
        req: {
          headers: new Headers({
            'x-forwarded-host': 'preview.example.test',
            'x-forwarded-proto': 'https',
          }),
        },
      },
      payload,
    )
    const captureScreenshot = vi.fn(async () =>
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+Xw3qWQAAAABJRU5ErkJggg==',
        'base64',
      ),
    )
    const previousDisabled = process.env.SEO_IMAGE_GENERATION_DISABLED
    process.env.SEO_IMAGE_GENERATION_DISABLED = 'false'

    let mediaId: number | string | null
    try {
      mediaId = await generateSeoMetaImage({
        collection: 'windows',
        doc: window as unknown as Record<string, unknown>,
        req,
        deps: {
          captureScreenshot,
          now: () => new Date('2026-08-08T12:00:00.000Z'),
        },
      })
    } finally {
      process.env.SEO_IMAGE_GENERATION_DISABLED = previousDisabled
    }

    expect(mediaId).not.toBeNull()
    await trackDocument('media', mediaId!)
    expect(captureScreenshot).toHaveBeenCalledWith({
      origin: 'http://127.0.0.1:3000',
      source: { collection: 'windows', id: window.id },
    })
    const media = await payload.findByID({
      collection: 'media',
      id: mediaId!,
      overrideAccess: true,
    })
    expect(media).toMatchObject({
      alt: 'SEO integration source Open Graph preview',
      seoGeneratedMetaImage: {
        sourceCollection: 'windows',
        sourceDocumentId: String(window.id),
        generatedAt: '2026-08-08T12:00:00.000Z',
      },
    })
    const publicMedia = await payload.findByID({
      collection: 'media',
      id: mediaId!,
      overrideAccess: false,
    })
    expect(publicMedia.id).toBe(mediaId)
    const updated = await payload.findByID({
      collection: 'windows',
      id: window.id,
      depth: 0,
      overrideAccess: true,
    })
    expect(updated.meta?.image).toBe(mediaId)
  })
})
