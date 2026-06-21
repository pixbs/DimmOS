import { describe, expect, it } from 'vitest'
import { classifyHref, getSlugFromHref, isInternalHref, toAbsoluteUrl } from '@/lib/context-menu'

describe('context menu link helpers', () => {
  it('classifies internal hrefs', () => {
    expect(isInternalHref('/about')).toBe(true)
    expect(classifyHref('/about')).toBe('internal')
  })

  it('classifies external hrefs', () => {
    expect(isInternalHref('https://example.com')).toBe(false)
    expect(isInternalHref('//example.com')).toBe(false)
    expect(classifyHref('https://example.com')).toBe('external')
  })

  it('extracts slugs from internal hrefs', () => {
    expect(getSlugFromHref('/about?x=1')).toBe('about')
    expect(getSlugFromHref('/')).toBeNull()
    expect(getSlugFromHref('https://example.com/about')).toBeNull()
  })

  it('resolves absolute URLs from relative hrefs', () => {
    expect(toAbsoluteUrl('/about', 'https://dimm.test')).toBe('https://dimm.test/about')
  })
})
