import { describe, expect, it } from 'vitest'

import { parseStat } from '@/lib/parseStat'

describe('parseStat', () => {
  it.each([
    ['10Mil', { value: 10, prefix: '', suffix: 'Mil', decimals: 0 }],
    ['$1.20K', { value: 1.2, prefix: '$', suffix: 'K', decimals: 2 }],
    ['98%', { value: 98, prefix: '', suffix: '%', decimals: 0 }],
    ['about -1,200.5+', { value: -1200.5, prefix: 'about ', suffix: '+', decimals: 1 }],
    ['No figures', { value: 0, prefix: '', suffix: 'No figures', decimals: 0 }],
  ])('parses %s without changing its affixes', (input, expected) => {
    expect(parseStat(input)).toEqual(expected)
  })
})
