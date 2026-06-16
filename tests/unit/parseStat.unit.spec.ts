import { describe, it, expect } from 'vitest'
import { parseStat } from '@/lib/parseStat'

describe('parseStat', () => {
  it('parses a trailing-suffix stat like "10Mil"', () => {
    expect(parseStat('10Mil')).toEqual({ value: 10, prefix: '', suffix: 'Mil', decimals: 0 })
  })

  it('parses a leading-prefix stat like "$1.2K"', () => {
    expect(parseStat('$1.2K')).toEqual({ value: 1.2, prefix: '$', suffix: 'K', decimals: 1 })
  })

  it('parses a percentage', () => {
    expect(parseStat('98%')).toEqual({ value: 98, prefix: '', suffix: '%', decimals: 0 })
  })

  it('strips thousands separators from the value', () => {
    expect(parseStat('1,200+')).toEqual({ value: 1200, prefix: '', suffix: '+', decimals: 0 })
  })

  it('treats the whole string as suffix when there is no number', () => {
    expect(parseStat('soon')).toEqual({ value: 0, prefix: '', suffix: 'soon', decimals: 0 })
  })

  it('reports the number of decimal places', () => {
    expect(parseStat('3.141').decimals).toBe(3)
  })
})
