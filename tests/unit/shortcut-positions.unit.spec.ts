// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SHORTCUT_POSITIONS_STORAGE_KEY,
  clearShortcutPositions,
  clampShortcutPosition,
  getDefaultShortcutPosition,
  getShortcutLayout,
  loadShortcutPositions,
  parseShortcutPositions,
  saveShortcutPosition,
} from '@/lib/shortcut-positions'

describe('shortcut position storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns {} when nothing is stored', () => {
    expect(loadShortcutPositions()).toEqual({})
  })

  it('saves shortcut positions by slug', () => {
    saveShortcutPosition('about', { x: 120, y: 80 })
    expect(loadShortcutPositions()).toEqual({ about: { x: 120, y: 80 } })
  })

  it('keeps invalid entries out of parsed storage', () => {
    expect(parseShortcutPositions({ about: { x: 1, y: 2 }, bad: { x: 'nope', y: 4 } })).toEqual({
      about: { x: 1, y: 2 },
    })
  })

  it('clears saved positions', () => {
    saveShortcutPosition('about', { x: 120, y: 80 })
    clearShortcutPositions()
    expect(localStorage.getItem(SHORTCUT_POSITIONS_STORAGE_KEY)).toBeNull()
  })

  it('clamps positions to the shortcut surface', () => {
    const layout = getShortcutLayout(1000, 600)
    expect(clampShortcutPosition({ x: -20, y: 999 }, layout)).toEqual({
      x: 0,
      y: 600 - layout.shortcutHeight,
    })
  })

  it('matches the old grid order for default desktop positions', () => {
    const layout = getShortcutLayout(1280, 760)
    expect(getDefaultShortcutPosition(0, layout)).toEqual({ x: 0, y: 0 })
    expect(getDefaultShortcutPosition(1, layout)).toEqual({ x: 128, y: 0 })
    expect(getDefaultShortcutPosition(10, layout)).toEqual({ x: 0, y: 128 })
  })

  it('returns {} for corrupt JSON instead of throwing', () => {
    localStorage.setItem(SHORTCUT_POSITIONS_STORAGE_KEY, '{nope')
    expect(loadShortcutPositions()).toEqual({})
  })
})
