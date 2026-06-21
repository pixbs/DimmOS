// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import {
  DEFAULT_DISPLAY_OPTIONS,
  DISPLAY_OPTIONS_STORAGE_KEY,
  loadDisplayOptions,
  mergeDisplayOptions,
  parseDisplayOptions,
  saveDisplayOptions,
} from '@/lib/display-options'

describe('display options storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('defaults to website cursor', () => {
    expect(loadDisplayOptions()).toEqual(DEFAULT_DISPLAY_OPTIONS)
  })

  it('persists system cursor mode', () => {
    saveDisplayOptions({ cursorMode: 'system' })
    expect(loadDisplayOptions()).toEqual({ cursorMode: 'system' })
  })

  it('merges updates over existing options', () => {
    expect(mergeDisplayOptions({ cursorMode: 'system' })).toEqual({ cursorMode: 'system' })
    expect(loadDisplayOptions()).toEqual({ cursorMode: 'system' })
  })

  it('ignores invalid cursor modes', () => {
    expect(parseDisplayOptions({ cursorMode: 'laser' })).toEqual(DEFAULT_DISPLAY_OPTIONS)
  })

  it('returns defaults for corrupt JSON instead of throwing', () => {
    localStorage.setItem(DISPLAY_OPTIONS_STORAGE_KEY, '{nope')
    expect(loadDisplayOptions()).toEqual(DEFAULT_DISPLAY_OPTIONS)
  })

  it('warns in development when stored JSON is corrupt', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(DISPLAY_OPTIONS_STORAGE_KEY, '{nope')
    loadDisplayOptions()
    expect(warn).toHaveBeenCalled()
  })
})
