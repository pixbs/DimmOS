import { describe, expect, it } from 'vitest'

import { bufferSize, pixelationSteps } from '@/lib/pixelate'

describe('pixelation math', () => {
  it('creates a strictly increasing ease-out sequence with stable endpoints', () => {
    const steps = pixelationSteps(5, 0.04)

    expect(steps).toHaveLength(5)
    expect(steps[0]).toBeCloseTo(0.04)
    expect(steps.at(-1)).toBe(1)
    expect(steps.every((step, index) => index === 0 || step > steps[index - 1]!)).toBe(true)
  })

  it('clamps invalid step and resolution bounds', () => {
    expect(pixelationSteps(1.9, -2)).toEqual([0.001, 1])
    expect(pixelationSteps(2, 8)).toEqual([0.999, 1])
  })

  it('rounds canvas buffers and never returns a zero-sized axis', () => {
    expect(bufferSize(640, 360, 0.25)).toEqual({ width: 160, height: 90 })
    expect(bufferSize(0, -10, 0.01)).toEqual({ width: 1, height: 1 })
  })
})
