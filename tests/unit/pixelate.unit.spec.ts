import { describe, it, expect } from 'vitest'
import { pixelationSteps, bufferSize } from '@/lib/pixelate'

describe('pixelationSteps', () => {
  it('produces the requested number of steps', () => {
    expect(pixelationSteps(14, 0.05)).toHaveLength(14)
  })

  it('starts at the minimum resolution and ends at full resolution', () => {
    const steps = pixelationSteps(10, 0.04)
    expect(steps[0]).toBeCloseTo(0.04, 5)
    expect(steps[steps.length - 1]).toBe(1)
  })

  it('is strictly increasing', () => {
    const steps = pixelationSteps(20, 0.05)
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1])
    }
  })

  it('clamps step count to at least 2', () => {
    expect(pixelationSteps(1, 0.1)).toHaveLength(2)
  })

  it('clamps the minimum resolution into (0,1)', () => {
    expect(pixelationSteps(5, 0)[0]).toBeGreaterThan(0)
    expect(pixelationSteps(5, 5)[0]).toBeLessThan(1)
  })
})

describe('bufferSize', () => {
  it('scales dimensions by the resolution factor', () => {
    expect(bufferSize(800, 600, 0.5)).toEqual({ width: 400, height: 300 })
  })

  it('never returns a dimension below 1', () => {
    expect(bufferSize(800, 600, 0.0001)).toEqual({ width: 1, height: 1 })
  })

  it('rounds to whole pixels', () => {
    expect(bufferSize(101, 101, 0.5)).toEqual({ width: 51, height: 51 })
  })
})
