import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BASE_Z,
  contentWindowId,
  isSystemWindowId,
  isSystemWindowKey,
  loadWindowsFromSession,
  parseOpenWindows,
  saveWindowsToSession,
  serializeOpenWindows,
  systemWindowId,
  type ManagedWindow,
} from '@/lib/window-state'
import { MemoryStorage } from '../helpers/memory-storage'

describe('window URL and identity contracts', () => {
  it('creates typed content and system identifiers', () => {
    expect(contentWindowId('work')).toBe('content:work')
    expect(systemWindowId('display-options')).toBe('system:display-options')
    expect(isSystemWindowKey('cookie-notice')).toBe(true)
    expect(isSystemWindowKey('work')).toBe(false)
    expect(isSystemWindowId('system:cookie-preferences')).toBe(true)
    expect(isSystemWindowId('content:cookie-preferences')).toBe(false)
    expect(isSystemWindowId('system:unknown')).toBe(false)
  })

  it('parses unique valid slugs from the open query parameter', () => {
    expect(parseOpenWindows(new URLSearchParams('open=work,%20about,work,bad_slug,,UPPER'))).toEqual([
      'work',
      'about',
    ])
    expect(parseOpenWindows(new URLSearchParams())).toEqual([])
  })

  it('serializes only valid slugs without silently renaming input', () => {
    expect(serializeOpenWindows(['work', 'case-study', 'bad_slug', 'UPPER'])).toBe(
      'work,case-study',
    )
  })
})

describe('window session persistence', () => {
  let sessionStorage: MemoryStorage

  beforeEach(() => {
    sessionStorage = new MemoryStorage()
    vi.stubGlobal('window', { sessionStorage })
  })

  it('restores safe legacy records at their root state', () => {
    sessionStorage.setItem(
      'open-windows',
      JSON.stringify([
        { slug: 'work', zIndex: BASE_Z + 2, minimized: true, cascadeIndex: 3 },
        { slug: 'about', zIndex: BASE_Z + 3, minimized: false },
        { slug: 'BAD', zIndex: 4, minimized: false },
        null,
      ]),
    )

    expect(loadWindowsFromSession()).toEqual([
      {
        id: 'content:work',
        kind: 'content',
        rootSlug: 'work',
        slug: 'work',
        historyStack: ['work'],
        historyIndex: 0,
        zIndex: BASE_Z + 2,
        minimized: true,
        cascadeIndex: 3,
        pendingMinimize: false,
      },
      {
        id: 'content:about',
        kind: 'content',
        rootSlug: 'about',
        slug: 'about',
        historyStack: ['about'],
        historyIndex: 0,
        zIndex: BASE_Z + 3,
        minimized: false,
        cascadeIndex: 0,
        pendingMinimize: false,
      },
    ])
  })

  it('stores only content roots, not transient navigation or system windows', () => {
    const content: ManagedWindow = {
      id: 'content:work',
      kind: 'content',
      rootSlug: 'work',
      slug: 'case-study',
      historyStack: ['work', 'case-study'],
      historyIndex: 1,
      zIndex: 53,
      minimized: false,
      cascadeIndex: 2,
      pendingMinimize: true,
    }
    const system: ManagedWindow = {
      ...content,
      id: 'system:display-options',
      kind: 'system',
      systemKey: 'display-options',
      rootSlug: 'display-options',
      slug: 'display-options',
    }

    saveWindowsToSession([content, system])

    expect(JSON.parse(sessionStorage.getItem('open-windows')!)).toEqual([
      { slug: 'work', zIndex: 53, minimized: false, cascadeIndex: 2 },
    ])
  })

  it('returns no state for missing, malformed, or non-array data', () => {
    expect(loadWindowsFromSession()).toEqual([])
    sessionStorage.setItem('open-windows', '{')
    expect(loadWindowsFromSession()).toEqual([])
    sessionStorage.setItem('open-windows', '{}')
    expect(loadWindowsFromSession()).toEqual([])
  })

  it('is safe during server rendering', () => {
    vi.stubGlobal('window', undefined)
    expect(loadWindowsFromSession()).toEqual([])
    expect(() => saveWindowsToSession([])).not.toThrow()
  })
})
