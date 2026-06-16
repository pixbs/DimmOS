// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/actions/getWindowContent', () => ({
  getWindowContent: vi.fn(),
}))

import { getWindowContent } from '@/actions/getWindowContent'
import {
  promiseCache,
  seedPromise,
  getOrCreatePromise,
  evictPromises,
} from '@/lib/window-promise-cache'
import type { WindowContentResult } from '@/lib/windowContent'

const mockFetch = vi.mocked(getWindowContent)

const flushMicrotasks = () => new Promise<void>((r) => setTimeout(r, 0))

const fakeResult = (title: string): WindowContentResult =>
  ({ type: 'window', title, blocks: [], behavior: {} }) as unknown as WindowContentResult

describe('window promise cache', () => {
  beforeEach(() => {
    promiseCache.clear()
    mockFetch.mockReset()
  })

  it('seedPromise is idempotent — second seed for the same slug is ignored', async () => {
    seedPromise('about', fakeResult('First'))
    seedPromise('about', fakeResult('Second'))
    const data = await promiseCache.get('about')!
    expect(data && data.type === 'window' ? data.title : null).toBe('First')
  })

  it('getOrCreatePromise returns the same promise on repeat calls', () => {
    mockFetch.mockResolvedValue(fakeResult('A'))
    const p1 = getOrCreatePromise('about')
    const p2 = getOrCreatePromise('about')
    expect(p1).toBe(p2)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('evicts a rejected promise after settling so the next call refetches', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'))
    const p = getOrCreatePromise('about')
    await expect(p).rejects.toThrow('network down')
    await flushMicrotasks()

    expect(promiseCache.has('about')).toBe(false)

    mockFetch.mockResolvedValueOnce(fakeResult('Recovered'))
    const p2 = getOrCreatePromise('about')
    expect(p2).not.toBe(p)
    const data = await p2
    expect(data && data.type === 'window' ? data.title : null).toBe('Recovered')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('an old rejection does not evict a newer replacement promise', async () => {
    let rejectOld!: (e: Error) => void
    mockFetch.mockImplementationOnce(
      () => new Promise<WindowContentResult>((_, rej) => (rejectOld = rej)),
    )
    const oldPromise = getOrCreatePromise('about')
    oldPromise.catch(() => {}) // observe to avoid unhandled rejection in test

    const replacement = Promise.resolve(fakeResult('Replacement'))
    promiseCache.set('about', replacement)

    rejectOld(new Error('stale failure'))
    await flushMicrotasks()

    expect(promiseCache.get('about')).toBe(replacement)
  })

  it('evictPromises removes the given slugs only', () => {
    seedPromise('a', fakeResult('A'))
    seedPromise('b', fakeResult('B'))
    seedPromise('c', fakeResult('C'))
    evictPromises(['a', 'b'])
    expect(promiseCache.has('a')).toBe(false)
    expect(promiseCache.has('b')).toBe(false)
    expect(promiseCache.has('c')).toBe(true)
  })
})
