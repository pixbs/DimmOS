import { describe, it, expect } from 'vitest'
import { EASE_OUT_QUAD } from '@/lib/easing'

describe('EASE_OUT_QUAD', () => {
  it('is the standard ease-out-quad cubic-bezier control points', () => {
    expect(EASE_OUT_QUAD).toEqual([0.25, 0.46, 0.45, 0.94])
  })

  it('is a 4-tuple suitable for Framer Motion transition.ease', () => {
    expect(EASE_OUT_QUAD).toHaveLength(4)
    for (const n of EASE_OUT_QUAD) {
      expect(typeof n).toBe('number')
    }
  })
})
