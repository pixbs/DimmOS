import { describe, expect, it } from 'vitest'

import {
  shouldRenderTitleAsWelcomeIntro,
  titleBlockToWelcomeIntro,
} from '@/components/content-blocks/sections/welcome-title'
import { footerButtonClass } from '@/components/window/footer-button'

describe('content presentation rules', () => {
  it('promotes a section title only when it follows an interactive portrait', () => {
    expect(
      shouldRenderTitleAsWelcomeIntro(
        { blockType: 'sectionTitle' },
        { blockType: 'interactivePortrait' },
      ),
    ).toBe(true)
    expect(shouldRenderTitleAsWelcomeIntro({ blockType: 'sectionTitle' })).toBe(false)
    expect(
      shouldRenderTitleAsWelcomeIntro({ blockType: 'stats' }, { blockType: 'interactivePortrait' }),
    ).toBe(false)
  })

  it('maps a promoted title without changing its authored content', () => {
    expect(
      titleBlockToWelcomeIntro({
        blockType: 'sectionTitle',
        title: 'Hello',
        role: 'Designer',
        description: 'Building useful things',
      }),
    ).toEqual({
      blockType: 'welcomeIntro',
      title: 'Hello',
      role: 'Designer',
      descriptor: 'Building useful things',
    })
  })

  it('builds consistent primary and secondary footer button classes', () => {
    expect(footerButtonClass()).toContain('bg-brand text-white')
    expect(footerButtonClass('secondary', 'w-full')).toMatch(/bg-bg text-fg w-full$/)
  })
})
