import { describe, expect, it, vi } from 'vitest'

import {
  classifyHref,
  copyText,
  getSlugFromHref,
  isInternalHref,
  toAbsoluteUrl,
} from '@/lib/context-menu'

describe('context menu URL behavior', () => {
  it.each([
    ['/work', true],
    ['/work?view=grid#examples', true],
    ['//cdn.example.test/file', false],
    ['https://example.test', false],
    ['mailto:hello@example.test', false],
  ])('classifies %s', (href, internal) => {
    expect(isInternalHref(href)).toBe(internal)
    expect(classifyHref(href)).toBe(internal ? 'internal' : 'external')
  })

  it('extracts only valid internal path slugs', () => {
    expect(getSlugFromHref('/case-study?view=grid#results')).toBe('case-study')
    expect(getSlugFromHref('/')).toBeNull()
    expect(getSlugFromHref('https://example.test/work')).toBeNull()
  })

  it('resolves relative links and preserves an unresolvable value', () => {
    expect(toAbsoluteUrl('/work', 'https://example.test')).toBe('https://example.test/work')
    expect(toAbsoluteUrl('not a url', 'not an origin')).toBe('not a url')
  })

  it('uses the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await copyText('share me')

    expect(writeText).toHaveBeenCalledExactlyOnceWith('share me')
  })
})
