import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_DISPLAY_OPTIONS,
  DISPLAY_OPTIONS_STORAGE_KEY,
  loadDisplayOptions,
  mergeDisplayOptions,
  parseDisplayOptions,
  saveDisplayOptions,
} from '@/lib/display-options'
import { MemoryStorage } from '../helpers/memory-storage'

describe('display option persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('accepts supported cursor modes and rejects malformed input', () => {
    expect(parseDisplayOptions({ cursorMode: 'system' })).toEqual({ cursorMode: 'system' })
    expect(parseDisplayOptions({ cursorMode: 'laser' })).toEqual(DEFAULT_DISPLAY_OPTIONS)
    expect(parseDisplayOptions(null)).toBe(DEFAULT_DISPLAY_OPTIONS)
  })

  it('loads defaults for missing or corrupt values', () => {
    expect(loadDisplayOptions()).toBe(DEFAULT_DISPLAY_OPTIONS)
    localStorage.setItem(DISPLAY_OPTIONS_STORAGE_KEY, '{broken')
    expect(loadDisplayOptions()).toBe(DEFAULT_DISPLAY_OPTIONS)
  })

  it('normalizes saved values and merges updates', () => {
    saveDisplayOptions({ cursorMode: 'system' })
    expect(JSON.parse(localStorage.getItem(DISPLAY_OPTIONS_STORAGE_KEY)!)).toEqual({
      cursorMode: 'system',
    })

    expect(mergeDisplayOptions({ cursorMode: 'website' })).toEqual({ cursorMode: 'website' })
    expect(loadDisplayOptions()).toEqual({ cursorMode: 'website' })
  })

  it('is safe when storage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(loadDisplayOptions()).toBe(DEFAULT_DISPLAY_OPTIONS)
    expect(() => saveDisplayOptions({ cursorMode: 'system' })).not.toThrow()
  })
})
