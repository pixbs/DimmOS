import type { ImageSectionBlock, StatsBlock, SummaryBlock } from '@/payload-types'
import { userEvent } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { cleanup, render } from 'vitest-browser-react'

import { AnimatedDivider } from '@/components/animation/animated-divider'
import { AnimatedText } from '@/components/animation/animated-text'
import { CountUp } from '@/components/animation/count-up'
import { PixelatedImage } from '@/components/animation/pixelated-image'
import { InteractivePortraitView } from '@/components/content-blocks/sections/interactive-portrait'
import { ImageSectionView } from '@/components/content-blocks/sections/image-section'
import { SectionTitleView } from '@/components/content-blocks/sections/section-title'
import { StatsView } from '@/components/content-blocks/sections/stats'
import { SummaryView } from '@/components/content-blocks/sections/summary'
import { WelcomeIntroView } from '@/components/content-blocks/sections/welcome-intro'

const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

describe('animation accessibility and browser behavior', () => {
  it('renders one natural accessible heading while visual units remain hidden', async () => {
    const screen = await render(
      <AnimatedText as="h2" split="letters" duration={0.01}>
        Better work
      </AnimatedText>,
    )

    await expect.element(screen.getByRole('heading', { name: 'Better work' })).toBeVisible()
    const heading = await screen.getByRole('heading', { name: 'Better work' }).element()
    expect(heading.querySelectorAll('[data-animated-unit]')).toHaveLength(10)
  })

  it('preserves stat affixes and reaches the authored value in a real animation frame', async () => {
    const screen = await render(<CountUp duration={0.01}>$1.2K</CountUp>)
    const accessibleValue = screen.getByText('$1.2K')
    await expect.element(accessibleValue).toBeVisible()

    const wrapper = (await accessibleValue.element()).parentElement!
    await expect.poll(() => wrapper.querySelector('[data-count-number]')?.textContent).toBe('1.2')
    expect(
      [...wrapper.querySelectorAll('[data-count-affix]')].map((node) => node.textContent),
    ).toEqual(['$', 'K'])
  })

  it('draws horizontal and vertical dividers with explicit orientation', async () => {
    await render(
      <div>
        <AnimatedDivider />
        <AnimatedDivider orientation="vertical" />
      </div>,
    )

    const horizontal = document.querySelector('[data-orientation="horizontal"]')
    const vertical = document.querySelector('[data-orientation="vertical"]')
    expect(horizontal).toBeInstanceOf(HTMLElement)
    expect(vertical).toBeInstanceOf(HTMLElement)
  })

  it('uses the browser canvas during image reveal and keeps the real image accessible', async () => {
    const screen = await render(
      <PixelatedImage
        src={transparentPixel}
        alt="Pixel reveal"
        width={120}
        height={80}
        steps={2}
        stepMs={0}
        className="h-20 w-32"
      />,
    )
    const image = screen.getByRole('img', { name: 'Pixel reveal' })
    await expect.element(image).toBeVisible()
    const wrapper = (await image.element()).parentElement!

    await expect.poll(() => wrapper.querySelector('canvas')).toBeNull()
    await expect
      .poll(async () => ((await image.element()) as HTMLImageElement).naturalWidth)
      .toBeGreaterThan(0)
  })
})

describe('content sections', () => {
  it('renders authored summary columns and their section boundary', async () => {
    const block = {
      blockType: 'summary',
      leftTitle: 'Challenge',
      leftBody: 'A fragmented workflow.',
      rightTitle: 'Outcome',
      rightBody: 'One consistent system.',
    } as SummaryBlock
    const screen = await render(<SummaryView block={block} />)

    await expect.element(screen.getByRole('heading', { name: 'Challenge' })).toBeVisible()
    await expect.element(screen.getByRole('heading', { name: 'Outcome' })).toBeVisible()
    await expect.element(screen.getByText('One consistent system.')).toBeVisible()
  })

  it('renders stats and omits an empty stats section', async () => {
    const screen = await render(
      <StatsView
        block={
          {
            blockType: 'stats',
            stats: [
              { id: 'one', value: '98%', label: 'Completion' },
              { id: 'two', value: '12K', label: 'Readers' },
            ],
          } as StatsBlock
        }
      />,
    )

    await expect.element(screen.getByText('Completion')).toBeVisible()
    await expect.element(screen.getByText('Readers')).toBeVisible()

    await cleanup()
    await render(<StatsView block={{ blockType: 'stats', stats: [] } as unknown as StatsBlock} />)
    expect(document.querySelector('[data-block-type="stats"]')).toBeNull()
  })

  it('renders standard and welcome title variants with their authored semantics', async () => {
    const screen = await render(
      <div>
        <SectionTitleView
          block={
            {
              blockType: 'sectionTitle',
              title: 'Selected work',
              role: 'Case studies',
              description: 'A focused archive.',
            } as never
          }
        />
        <WelcomeIntroView
          block={{
            blockType: 'welcomeIntro',
            title: 'Hello, I am Dimm',
            role: 'Designer and developer',
            descriptor: 'I make expressive digital systems.',
          }}
        />
      </div>,
    )

    await expect.element(screen.getByRole('heading', { name: 'Selected work' })).toBeVisible()
    await expect.element(screen.getByRole('heading', { name: 'Hello, I am Dimm' })).toBeVisible()
    await expect.element(screen.getByText('I make expressive digital systems.')).toBeVisible()
  })

  it('renders valid media and ignores unresolved image relationships', async () => {
    const screen = await render(
      <ImageSectionView
        block={
          {
            blockType: 'imageSection',
            image: { id: 4, url: transparentPixel, alt: 'Project cover', width: 120, height: 80 },
          } as ImageSectionBlock
        }
      />,
    )
    await expect.element(screen.getByRole('img', { name: 'Project cover' })).toBeVisible()

    await cleanup()
    await render(
      <ImageSectionView block={{ blockType: 'imageSection', image: 4 } as ImageSectionBlock} />,
    )
    expect(document.querySelector('[data-block-type="imageSection"]')).toBeNull()
  })

  it('renders the interactive portrait and reacts to pointer input', async () => {
    const screen = await render(
      <InteractivePortraitView block={{ blockType: 'interactivePortrait' } as never} />,
    )
    const portrait = screen.getByRole('img', { name: 'Portrait that follows pointer movement' })
    await expect.element(portrait).toBeVisible()
    await userEvent.hover(portrait)

    const region = (await portrait.element()).closest(
      '[aria-label="Interactive portrait"]',
    ) as HTMLElement
    await expect.poll(() => region.dataset.gazeMode).toMatch(/pointer|idle/)
    expect(region.querySelectorAll('[data-look-index]').length).toBeGreaterThan(10)
  })
})
