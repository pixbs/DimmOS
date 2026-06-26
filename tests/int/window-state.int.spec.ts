import { describe, it, expect, vi } from 'vitest'
import {
  BASE_Z,
  contentWindowId,
  loadWindowsFromSession,
  parseOpenWindows,
  saveWindowsToSession,
  serializeOpenWindows,
  systemWindowId,
  type ManagedWindow,
} from '../../src/lib/window-state'

describe('parseOpenWindows', () => {
  it('returns slugs from the open param', () => {
    const params = new URLSearchParams('open=works,welcome')
    expect(parseOpenWindows(params)).toEqual(['works', 'welcome'])
  })

  it('returns empty array when param is absent', () => {
    expect(parseOpenWindows(new URLSearchParams(''))).toEqual([])
  })

  it('returns empty array when param is empty string', () => {
    expect(parseOpenWindows(new URLSearchParams('open='))).toEqual([])
  })

  it('deduplicates repeated slugs', () => {
    const params = new URLSearchParams('open=works,works,about')
    expect(parseOpenWindows(params)).toEqual(['works', 'about'])
  })

  it('strips slugs with invalid characters', () => {
    const params = new URLSearchParams('open=works,../../etc,valid-slug')
    expect(parseOpenWindows(params)).toEqual(['works', 'valid-slug'])
  })

  it('strips slugs with uppercase letters', () => {
    const params = new URLSearchParams('open=Works,about')
    expect(parseOpenWindows(params)).toEqual(['about'])
  })

  it('strips slugs with spaces', () => {
    const params = new URLSearchParams('open=my page,about')
    expect(parseOpenWindows(params)).toEqual(['about'])
  })
})

describe('serializeOpenWindows', () => {
  it('joins slugs with commas', () => {
    expect(serializeOpenWindows(['works', 'about'])).toBe('works,about')
  })

  it('returns empty string for empty array', () => {
    expect(serializeOpenWindows([])).toBe('')
  })

  it('filters out invalid slugs', () => {
    expect(serializeOpenWindows(['valid', '../../bad', 'also-valid'])).toBe('valid,also-valid')
  })

  it('round-trips with parseOpenWindows', () => {
    const slugs = ['works', 'about', 'contact']
    const serialized = serializeOpenWindows(slugs)
    const params = new URLSearchParams(`open=${serialized}`)
    expect(parseOpenWindows(params)).toEqual(slugs)
  })
})

describe('managed window session persistence', () => {
  it('persists content windows but not system window open state', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    })

    const contentWindow: ManagedWindow = {
      id: contentWindowId('about'),
      kind: 'content',
      rootSlug: 'about',
      slug: 'about',
      historyStack: ['about'],
      historyIndex: 0,
      zIndex: BASE_Z,
      minimized: false,
      cascadeIndex: 0,
      pendingMinimize: false,
    }
    const systemWindow: ManagedWindow = {
      id: systemWindowId('display-options'),
      kind: 'system',
      systemKey: 'display-options',
      rootSlug: systemWindowId('display-options'),
      slug: systemWindowId('display-options'),
      historyStack: [],
      historyIndex: 0,
      zIndex: BASE_Z + 1,
      minimized: false,
      cascadeIndex: 1,
      pendingMinimize: false,
    }

    saveWindowsToSession([contentWindow, systemWindow])

    const raw = storage.get('open-windows')
    expect(raw).toContain('about')
    expect(raw).not.toContain('display-options')
    expect(loadWindowsFromSession()).toMatchObject([
      { id: contentWindowId('about'), kind: 'content', rootSlug: 'about' },
    ])

    vi.unstubAllGlobals()
  })
})
