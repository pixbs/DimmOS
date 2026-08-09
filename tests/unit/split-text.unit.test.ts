import { describe, expect, it } from 'vitest'

import { splitText } from '@/lib/splitText'

describe('splitText', () => {
  it('keeps words intact in word mode while normalizing whitespace', () => {
    expect(splitText('  Build\n better\tthings ', 'words')).toEqual({
      words: [['Build'], ['better'], ['things']],
    })
  })

  it('splits Unicode text by code point in letter mode', () => {
    expect(splitText('A🚀 go', 'letters')).toEqual({ words: [['A', '🚀'], ['g', 'o']] })
  })

  it('returns no animation groups for blank input', () => {
    expect(splitText(' \n\t ', 'letters')).toEqual({ words: [] })
  })
})
