import { describe, expect, it, vi } from 'vitest'

import { DESKTOP_BREAKPOINT, DESKTOP_MEDIA_QUERY, isDesktopViewport } from '@/lib/breakpoints'
import { EASE_OUT_QUAD } from '@/lib/easing'
import { cn } from '@/lib/utils'

describe('shared UI constants and helpers', () => {
  it('keeps the JavaScript desktop breakpoint aligned with the media query', () => {
    expect(DESKTOP_BREAKPOINT).toBe(1024)
    expect(DESKTOP_MEDIA_QUERY).toBe('(min-width: 1024px)')
  })

  it('detects desktop viewports without assuming a browser during SSR', () => {
    vi.stubGlobal('window', undefined)
    expect(isDesktopViewport()).toBe(false)
    vi.stubGlobal('window', { innerWidth: 1023 })
    expect(isDesktopViewport()).toBe(false)
    vi.stubGlobal('window', { innerWidth: 1024 })
    expect(isDesktopViewport()).toBe(true)
  })

  it('provides the established entrance easing curve', () => {
    expect(EASE_OUT_QUAD).toEqual([0.25, 0.46, 0.45, 0.94])
  })

  it('combines conditional class values with clsx semantics', () => {
    expect(cn('window', false && 'hidden', { active: true }, ['resizable'])).toBe(
      'window active resizable',
    )
  })
})
