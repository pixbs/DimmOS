import { describe, it, beforeAll, afterAll, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { revalidatePath, revalidateTag } from 'next/cache'

let payload: Payload
const createdIds: number[] = []
const createdArticleIds: number[] = []

describe('Windows revalidation hooks', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  beforeEach(() => {
    vi.mocked(revalidatePath).mockClear()
  })

  afterAll(async () => {
    for (const id of createdIds) {
      await payload.delete({ collection: 'windows', id, overrideAccess: true })
    }
  })

  it('calls revalidatePath with slug and / after create', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Revalidation Test',
        slug: 'test-revalidation-window',
      },
      overrideAccess: true,
    })

    createdIds.push(doc.id)
    expect(revalidatePath).toHaveBeenCalledWith('/test-revalidation-window')
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('calls revalidatePath after update', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Update Test',
        slug: 'test-update-window',
      },
      overrideAccess: true,
    })
    createdIds.push(doc.id)
    vi.mocked(revalidatePath).mockClear()

    await payload.update({
      collection: 'windows',
      id: doc.id,
      data: { title: 'Updated Title' },
      overrideAccess: true,
    })

    expect(revalidatePath).toHaveBeenCalledWith('/test-update-window')
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('skipHooks guard prevents re-entry', async () => {
    const doc = await payload.create({
      collection: 'windows',
      data: {
        title: 'Skip Hooks Test',
        slug: 'test-skip-hooks-window',
      },
      overrideAccess: true,
    })
    createdIds.push(doc.id)

    const callCount = vi.mocked(revalidatePath).mock.calls.length
    expect(callCount).toBeGreaterThan(0)
    const callsPerTrigger = callCount
    expect(callsPerTrigger).toBeLessThanOrEqual(2)
  })

  it('revalidates the window-content cache tag', async () => {
    vi.mocked(revalidateTag).mockClear()
    const doc = await payload.create({
      collection: 'windows',
      data: { title: 'Tag Test', slug: 'test-tag-window' },
      overrideAccess: true,
    })
    createdIds.push(doc.id)
    expect(vi.mocked(revalidateTag).mock.calls.some(([tag]) => tag === 'window-content')).toBe(true)
  })
})

describe('Articles revalidation hooks', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  beforeEach(() => {
    vi.mocked(revalidatePath).mockClear()
    vi.mocked(revalidateTag).mockClear()
  })

  afterAll(async () => {
    for (const id of createdArticleIds) {
      await payload.delete({ collection: 'articles', id, overrideAccess: true })
    }
  })

  it('revalidates slug, /, and the window-content tag after create', async () => {
    const doc = await payload.create({
      collection: 'articles',
      data: { title: 'Reval Article', type: 'service', slug: 'test-revalidation-article' },
      overrideAccess: true,
    })
    createdArticleIds.push(doc.id)

    expect(revalidatePath).toHaveBeenCalledWith('/test-revalidation-article')
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(vi.mocked(revalidateTag).mock.calls.some(([tag]) => tag === 'window-content')).toBe(true)
  })

  it('skipHooks guard prevents re-entry on articles', async () => {
    const doc = await payload.create({
      collection: 'articles',
      data: { title: 'Skip Hooks Article', type: 'service', slug: 'test-skip-hooks-article' },
      overrideAccess: true,
    })
    createdArticleIds.push(doc.id)

    const slugCalls = vi
      .mocked(revalidatePath)
      .mock.calls.filter(([p]) => p === '/test-skip-hooks-article').length
    expect(slugCalls).toBe(1)
  })
})
