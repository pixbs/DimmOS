import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clamp, loadSavedPosition, mergePositionToStorage, parsePx } from '@/lib/window-positions'
import { MemoryStorage } from '../helpers/memory-storage'

describe('window position helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('merges one window without overwriting another', () => {
    mergePositionToStorage('work', { x: 10, y: 20 })
    mergePositionToStorage('work', { w: 640 })
    mergePositionToStorage('about', { x: 50 })

    expect(loadSavedPosition('work')).toEqual({ x: 10, y: 20, w: 640 })
    expect(loadSavedPosition('about')).toEqual({ x: 50 })
    expect(loadSavedPosition('missing')).toEqual({})
  })

  it('recovers from invalid stored JSON', () => {
    localStorage.setItem('window-positions', 'invalid')
    expect(loadSavedPosition('work')).toEqual({})
  })

  it('reads CSS pixel values with a fallback', () => {
    const element = { style: { getPropertyValue: vi.fn().mockReturnValue('48.5px') } } as unknown as HTMLElement
    expect(parsePx(element, '--x', 3)).toBe(48.5)
    element.style.getPropertyValue = vi.fn().mockReturnValue('auto')
    expect(parsePx(element, '--x', 3)).toBe(3)
  })

  it('clamps values to inclusive bounds', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(6, 0, 10)).toBe(6)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})
