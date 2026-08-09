import { describe, expect, it, vi } from 'vitest'

import {
  deleteGeneratedSeoMetaImages,
  findGeneratedSeoMetaImages,
  getRelationId,
  isGeneratedSeoMetaImage,
} from '@/lib/seo-image/media'
import {
  createSeoImageContentSignature,
  getSeoImageSignatureInput,
} from '@/lib/seo-image/signature'

describe('SEO media relationship helpers', () => {
  it.each([
    [12, 12],
    ['12', '12'],
    [{ id: 7 }, 7],
    [{ value: { id: 'nested' } }, 'nested'],
    [{ value: null }, null],
    [null, null],
  ])('resolves relation %#', (input, expected) => {
    expect(getRelationId(input)).toBe(expected)
  })

  it('recognizes generated media only when its source identity is complete', () => {
    expect(
      isGeneratedSeoMetaImage({
        seoGeneratedMetaImage: { sourceCollection: 'articles', sourceDocumentId: '5' },
      }),
    ).toBe(true)
    expect(isGeneratedSeoMetaImage({ seoGeneratedMetaImage: { sourceCollection: 'articles' } })).toBe(
      false,
    )
    expect(isGeneratedSeoMetaImage(null)).toBe(false)
  })

  it('queries generated media by source identity', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 1 }] })
    const payload = { find } as never

    await expect(
      findGeneratedSeoMetaImages(payload, { collection: 'articles', id: 42 }),
    ).resolves.toEqual([{ id: 1 }])
    expect(find).toHaveBeenCalledWith({
      collection: 'media',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      where: {
        and: [
          { 'seoGeneratedMetaImage.sourceCollection': { equals: 'articles' } },
          { 'seoGeneratedMetaImage.sourceDocumentId': { equals: '42' } },
        ],
      },
    })
  })

  it('deletes obsolete generated media while retaining an explicit image', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [{ id: 1 }, { id: 2 }, { id: 'legacy' }] }),
      delete: vi.fn().mockResolvedValue(undefined),
    } as never

    await expect(
      deleteGeneratedSeoMetaImages(payload, { collection: 'windows', id: 'work' }, { exceptId: 2 }),
    ).resolves.toEqual([1])
    expect((payload as { delete: ReturnType<typeof vi.fn> }).delete).toHaveBeenCalledTimes(2)
    expect((payload as { delete: ReturnType<typeof vi.fn> }).delete).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 2 }),
    )
  })
})

describe('SEO content signatures', () => {
  it('is stable across object order and operational timestamps', () => {
    const first = {
      title: 'Project',
      slug: 'project',
      updatedAt: 'today',
      content: { z: 1, a: 2 },
      bgImage: { id: 9, url: '/ignored.jpg' },
      tags: [{ value: { id: 4 } }],
    }
    const second = {
      tags: [{ value: { id: 4, label: 'ignored' } }],
      bgImage: { id: 9 },
      content: { a: 2, z: 1 },
      createdAt: 'yesterday',
      slug: 'project',
      title: 'Project',
    }

    expect(createSeoImageContentSignature('articles', first)).toBe(
      createSeoImageContentSignature('articles', second),
    )
  })

  it('changes when article content that affects rendering changes', () => {
    const base = { title: 'Project', slug: 'project', year: 2025 }
    expect(createSeoImageContentSignature('articles', base)).not.toBe(
      createSeoImageContentSignature('articles', { ...base, year: 2026 }),
    )
  })

  it('normalizes dates and selects only render-relevant window fields', () => {
    expect(
      getSeoImageSignatureInput('windows', {
        title: 'About',
        slug: 'about',
        content: { date: new Date('2026-01-02T03:04:05.000Z') },
        windowResizable: true,
        unrelated: 'ignored',
      }),
    ).toEqual({
      behavior: {
        windowCollapsible: undefined,
        windowDefaultView: undefined,
        windowDisplayHistory: undefined,
        windowDisplaySearch: undefined,
        windowDisplayViewToggle: undefined,
        windowExpandable: undefined,
        windowResizable: true,
      },
      buttons: undefined,
      collection: 'windows',
      content: { date: '2026-01-02T03:04:05.000Z' },
      slug: 'about',
      title: 'About',
    })
  })
})
