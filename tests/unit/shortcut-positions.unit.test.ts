import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SHORTCUT_POSITIONS_STORAGE_KEY,
  clampShortcutPosition,
  clearShortcutPositions,
  getDefaultShortcutPosition,
  getShortcutCols,
  getShortcutLayout,
  loadShortcutPositions,
  parseShortcutPositions,
  saveShortcutPosition,
} from '@/lib/shortcut-positions'
import { MemoryStorage } from '../helpers/memory-storage'

describe('desktop shortcut positioning', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it.each([
    [375, 6],
    [768, 12],
    [1280, 20],
    [1536, 32],
  ])('uses %i grid columns at width %i', (width, columns) => {
    expect(getShortcutCols(width)).toBe(columns)
  })

  it('derives layout and wraps default positions into rows', () => {
    const layout = getShortcutLayout(600, 400)
    expect(layout).toEqual({
      surfaceWidth: 600,
      surfaceHeight: 400,
      tile: 100,
      shortcutWidth: 200,
      shortcutHeight: 200,
    })
    expect(getDefaultShortcutPosition(4, layout)).toEqual({ x: 200, y: 200 })
  })

  it('clamps dragged shortcuts inside even a tiny surface', () => {
    const layout = getShortcutLayout(300, 100)
    expect(clampShortcutPosition({ x: -10, y: 500 }, layout)).toEqual({ x: 0, y: 0 })
  })

  it('keeps only finite coordinate pairs when parsing', () => {
    expect(
      parseShortcutPositions({
        work: { x: 1, y: 2 },
        bad: { x: Number.NaN, y: 2 },
        partial: { x: 1 },
      }),
    ).toEqual({ work: { x: 1, y: 2 } })
    expect(parseShortcutPositions('wrong')).toEqual({})
  })

  it('saves, reloads, and clears independent shortcut positions', () => {
    saveShortcutPosition('work', { x: 10, y: 20 })
    saveShortcutPosition('about', { x: 30, y: 40 })
    expect(loadShortcutPositions()).toEqual({
      work: { x: 10, y: 20 },
      about: { x: 30, y: 40 },
    })

    clearShortcutPositions()
    expect(localStorage.getItem(SHORTCUT_POSITIONS_STORAGE_KEY)).toBeNull()
  })

  it('returns an empty map for missing or corrupt storage', () => {
    expect(loadShortcutPositions()).toEqual({})
    localStorage.setItem(SHORTCUT_POSITIONS_STORAGE_KEY, '{')
    expect(loadShortcutPositions()).toEqual({})
  })
})
