import {
  generateSeoMetaImage,
  getSeoImageOrigin,
  isSeoImageGenerationDisabled,
} from '@/lib/seo-image/generation'
import { createSeoImageContentSignature } from '@/lib/seo-image/signature'
import { describe, expect, it, vi } from 'vitest'

function requestWith(payload: Record<string, unknown>, headers: HeadersInit = {}) {
  return { headers: new Headers(headers), payload } as never
}

describe('SEO image generation decisions', () => {
  it('resolves the configured origin in priority order', () => {
    vi.stubEnv('SEO_IMAGE_ORIGIN', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')

    expect(getSeoImageOrigin()).toBe('http://localhost:3000')
    expect(getSeoImageOrigin(requestWith({}, { host: 'local.test' }))).toBe('http://local.test')
    expect(
      getSeoImageOrigin(
        requestWith({}, { 'x-forwarded-host': 'proxy.test', 'x-forwarded-proto': 'https' }),
      ),
    ).toBe('https://proxy.test')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://site.test')
    expect(getSeoImageOrigin(requestWith({}, { host: 'ignored.test' }))).toBe('https://site.test')
    vi.stubEnv('SEO_IMAGE_ORIGIN', 'https://capture.test')
    expect(getSeoImageOrigin()).toBe('https://capture.test')
  })

  it('returns the existing relation while generation is disabled and rejects missing source IDs', async () => {
    vi.stubEnv('SEO_IMAGE_GENERATION_DISABLED', 'true')
    expect(isSeoImageGenerationDisabled()).toBe(true)
    await expect(
      generateSeoMetaImage({
        collection: 'windows',
        doc: { meta: { image: { value: { id: 44 } } } },
        req: requestWith({}),
      }),
    ).resolves.toBe(44)

    vi.stubEnv('SEO_IMAGE_GENERATION_DISABLED', 'false')
    await expect(
      generateSeoMetaImage({ collection: 'windows', doc: {}, req: requestWith({}) }),
    ).resolves.toBeNull()

  })

  it('preserves a manually selected image and removes generated leftovers', async () => {
    vi.stubEnv('SEO_IMAGE_GENERATION_DISABLED', 'false')
    const payload = {
      findByID: vi.fn(async () => ({ id: 9, alt: 'Manual image' })),
      find: vi.fn(async () => ({
        docs: [
          {
            id: 10,
            seoGeneratedMetaImage: {
              sourceCollection: 'windows',
              sourceDocumentId: '3',
            },
          },
        ],
      })),
      delete: vi.fn(async () => ({})),
    }

    await expect(
      generateSeoMetaImage({
        collection: 'windows',
        doc: { id: 3, title: 'Manual', meta: { image: 9 } },
        req: requestWith(payload),
      }),
    ).resolves.toBe(9)
    expect(payload.delete).toHaveBeenCalledWith({
      collection: 'media',
      id: 10,
      overrideAccess: true,
    })

  })

  it('reuses an unchanged generated image and deletes only stale siblings', async () => {
    vi.stubEnv('SEO_IMAGE_GENERATION_DISABLED', 'false')
    const doc = { id: 5, title: 'Stable source', meta: { image: 21 } }
    const signature = createSeoImageContentSignature('articles', doc)
    const current = {
      id: 21,
      seoGeneratedMetaImage: {
        sourceCollection: 'articles',
        sourceDocumentId: '5',
        contentSignature: signature,
      },
    }
    const stale = {
      id: 22,
      seoGeneratedMetaImage: {
        sourceCollection: 'articles',
        sourceDocumentId: '5',
        contentSignature: 'stale',
      },
    }
    const payload = {
      findByID: vi.fn(async () => current),
      find: vi.fn(async () => ({ docs: [current, stale] })),
      delete: vi.fn(async () => ({})),
    }

    await expect(
      generateSeoMetaImage({
        collection: 'articles',
        doc,
        req: requestWith(payload),
      }),
    ).resolves.toBe(21)
    expect(payload.delete).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ id: 22 }),
    )
  })
})
