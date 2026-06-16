import { describe, it, expect } from 'vitest'
import { splitText } from '@/lib/splitText'

describe('splitText', () => {
  it('splits into single-unit word groups in words mode', () => {
    expect(splitText('hello brave world', 'words')).toEqual({
      words: [['hello'], ['brave'], ['world']],
    })
  })

  it('splits each word into its characters in letters mode', () => {
    expect(splitText('ab cd', 'letters')).toEqual({
      words: [
        ['a', 'b'],
        ['c', 'd'],
      ],
    })
  })

  it('collapses whitespace runs and trims', () => {
    expect(splitText('  one   two  ', 'words')).toEqual({ words: [['one'], ['two']] })
  })

  it('returns no word groups for empty or whitespace-only input', () => {
    expect(splitText('', 'words')).toEqual({ words: [] })
    expect(splitText('   ', 'letters')).toEqual({ words: [] })
  })

  it('preserves the original characters when rejoined (letters mode)', () => {
    const text = 'Design Systems'
    const { words } = splitText(text, 'letters')
    const rejoined = words.map((w) => w.join('')).join(' ')
    expect(rejoined).toBe(text)
  })

  it('handles unicode characters as single units', () => {
    expect(splitText('café', 'letters')).toEqual({ words: [['c', 'a', 'f', 'é']] })
  })
})
