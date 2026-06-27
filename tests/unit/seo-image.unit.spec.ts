import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateSeoMetaImage } from '@/lib/seo-image/generation'
import { deleteGeneratedSeoMetaImages, isGeneratedSeoMetaImage } from '@/lib/seo-image/media'
import { createSeoImageContentSignature } from '@/lib/seo-image/signature'

type FakeMedia = {
  id: number
  seoGeneratedMetaImage?: {
    contentSignature?: string
    generatedAt?: string
    sourceCollection?: 'windows' | 'articles'
    sourceDocumentId?: string
  }
}

function generatedMedia(id: number, signature = 'old-signature'): FakeMedia {
  return {
    id,
    seoGeneratedMetaImage: {
      contentSignature: signature,
      generatedAt: '2026-01-01T00:00:00.000Z',
      sourceCollection: 'windows',
      sourceDocumentId: '1',
    },
  }
}

function createDoc(meta: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Preview Window',
    slug: 'preview-window',
    content: [{ blockType: 'richText', content: { root: { children: [] } } }],
    meta,
  }
}

function createPayload(media: FakeMedia[] = []) {
  const state = {
    media: [...media],
    nextId: 100,
  }

  const payload = {
    create: vi.fn(async ({ data }: any) => {
      const doc = { id: state.nextId++, ...data }
      state.media.push(doc)
      return doc
    }),
    delete: vi.fn(async ({ id }: any) => {
      state.media = state.media.filter((doc) => String(doc.id) !== String(id))
      return { id }
    }),
    find: vi.fn(async () => ({
      docs: state.media.filter(
        (doc) =>
          doc.seoGeneratedMetaImage?.sourceCollection === 'windows' &&
          doc.seoGeneratedMetaImage?.sourceDocumentId === '1',
      ),
    })),
    findByID: vi.fn(async ({ id }: any) => {
      const doc = state.media.find((item) => String(item.id) === String(id))
      if (!doc) throw new Error('not found')
      return doc
    }),
    logger: { error: vi.fn() },
    update: vi.fn(async ({ data }: any) => data),
  }

  return { payload, state }
}

function createReq(payload: ReturnType<typeof createPayload>['payload']) {
  return {
    context: {},
    headers: new Headers({ host: 'example.test' }),
    payload,
  } as any
}

describe('SEO image signatures', () => {
  it('is stable for identical content and changes when preview content changes', () => {
    const first = createSeoImageContentSignature('windows', createDoc())
    const second = createSeoImageContentSignature('windows', createDoc())
    const changed = createSeoImageContentSignature(
      'windows',
      createDoc({ title: 'Ignored because meta is not in the signature input' }),
    )
    const contentChanged = createSeoImageContentSignature('windows', {
      ...createDoc(),
      content: [{ blockType: 'sectionTitle', title: 'Different' }],
    })

    expect(second).toBe(first)
    expect(changed).toBe(first)
    expect(contentChanged).not.toBe(first)
  })
})

describe('generated SEO media helpers', () => {
  it('recognizes generated media records by hidden tracking metadata', () => {
    expect(isGeneratedSeoMetaImage(generatedMedia(1))).toBe(true)
    expect(isGeneratedSeoMetaImage({ id: 2 })).toBe(false)
  })
})

describe('generateSeoMetaImage', () => {
  beforeEach(() => {
    vi.stubEnv('SEO_IMAGE_GENERATION_DISABLED', 'false')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('creates media and updates meta.image when no image exists', async () => {
    const { payload } = createPayload()
    const captureScreenshot = vi.fn(async () => Buffer.from('fake-png'))
    const doc = createDoc()

    const result = await generateSeoMetaImage({
      collection: 'windows',
      deps: {
        captureScreenshot,
        now: () => new Date('2026-06-01T00:00:00.000Z'),
      },
      doc,
      req: createReq(payload),
    })

    expect(result).toBe(100)
    expect(captureScreenshot).toHaveBeenCalledWith({
      origin: 'http://example.test',
      source: { collection: 'windows', id: 1 },
    })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        data: expect.objectContaining({
          alt: 'Preview Window Open Graph preview',
          seoGeneratedMetaImage: expect.objectContaining({
            sourceCollection: 'windows',
            sourceDocumentId: '1',
          }),
        }),
      }),
    )
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'windows',
        data: { meta: { image: 100 } },
        id: 1,
      }),
    )
  })

  it('keeps an up-to-date generated image and removes older generations', async () => {
    const doc = createDoc({ image: 10 })
    const signature = createSeoImageContentSignature('windows', doc)
    const { payload } = createPayload([generatedMedia(10, signature), generatedMedia(11)])

    const result = await generateSeoMetaImage({
      collection: 'windows',
      deps: { captureScreenshot: vi.fn() },
      doc,
      req: createReq(payload),
    })

    expect(result).toBe(10)
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
    expect(payload.delete).toHaveBeenCalledWith({
      collection: 'media',
      id: 11,
      overrideAccess: true,
    })
  })

  it('refreshes stale generated images', async () => {
    const { payload } = createPayload([generatedMedia(20)])
    const captureScreenshot = vi.fn(async () => Buffer.from('new-png'))

    const result = await generateSeoMetaImage({
      collection: 'windows',
      deps: {
        captureScreenshot,
        now: () => new Date('2026-06-01T00:00:00.000Z'),
      },
      doc: createDoc({ image: 20 }),
      req: createReq(payload),
    })

    expect(result).toBe(100)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { meta: { image: 100 } },
      }),
    )
    expect(payload.delete).toHaveBeenCalledWith({
      collection: 'media',
      id: 20,
      overrideAccess: true,
    })
  })

  it('preserves manual images and deletes generated leftovers', async () => {
    const manualMedia = { id: 30 }
    const { payload } = createPayload([manualMedia, generatedMedia(31)])
    const captureScreenshot = vi.fn(async () => Buffer.from('unused'))

    const result = await generateSeoMetaImage({
      collection: 'windows',
      deps: { captureScreenshot },
      doc: createDoc({ image: 30 }),
      req: createReq(payload),
    })

    expect(result).toBe(30)
    expect(captureScreenshot).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
    expect(payload.delete).toHaveBeenCalledWith({
      collection: 'media',
      id: 31,
      overrideAccess: true,
    })
  })

  it('deletes generated media for a deleted source document', async () => {
    const { payload } = createPayload([generatedMedia(40), generatedMedia(41)])

    const deleted = await deleteGeneratedSeoMetaImages(payload as any, {
      collection: 'windows',
      id: 1,
    })

    expect(deleted).toEqual([40, 41])
    expect(payload.delete).toHaveBeenCalledTimes(2)
  })
})
