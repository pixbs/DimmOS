// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadSavedPosition, mergePositionToStorage } from '@/lib/window-positions'

describe('window position persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns {} when nothing is stored', () => {
    expect(loadSavedPosition('about')).toEqual({})
  })

  it('merges partial updates — {x,y} then {w,h} accumulates', () => {
    mergePositionToStorage('about', { x: 100, y: 50 })
    mergePositionToStorage('about', { w: 640, h: 480 })
    expect(loadSavedPosition('about')).toEqual({ x: 100, y: 50, w: 640, h: 480 })
  })

  it('keeps entries for different keys independent', () => {
    mergePositionToStorage('about', { x: 1 })
    mergePositionToStorage('contact', { x: 2 })
    expect(loadSavedPosition('about')).toEqual({ x: 1 })
    expect(loadSavedPosition('contact')).toEqual({ x: 2 })
  })

  it('returns {} for corrupt JSON instead of throwing', () => {
    localStorage.setItem('window-positions', '{not json')
    expect(loadSavedPosition('about')).toEqual({})
  })

  it('merge over corrupt JSON starts fresh instead of throwing', () => {
    localStorage.setItem('window-positions', '{not json')
    expect(() => mergePositionToStorage('about', { x: 5 })).not.toThrow()
    expect(loadSavedPosition('about')).toEqual({ x: 5 })
  })

  it('warns in development when stored JSON is corrupt', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem('window-positions', '{not json')
    loadSavedPosition('about')
    expect(warn).toHaveBeenCalled()
  })
})
