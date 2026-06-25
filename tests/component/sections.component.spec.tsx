import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import type { Media } from '@/payload-types'

// framer-motion's useScroll measures a scroll container via a frameloop that
// jsdom can't satisfy (it throws asynchronously after the test). Stub it with a
// static progress value — the parallax offset isn't what these tests assert.
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, useScroll: () => ({ scrollYProgress: actual.motionValue(0) }) }
})
import { HeroView } from '@/components/content-blocks/sections/hero'
import { SummaryView } from '@/components/content-blocks/sections/summary'
import { StatsView } from '@/components/content-blocks/sections/stats'
import { ImageSectionView } from '@/components/content-blocks/sections/image-section'
import { DescriptionView } from '@/components/content-blocks/sections/description'
import { SectionTitleView } from '@/components/content-blocks/sections/section-title'
import { WelcomeIntroView } from '@/components/content-blocks/sections/welcome-intro'
import { InteractivePortraitView } from '@/components/content-blocks/sections/interactive-portrait'
import { DocumentMediaProvider } from '@/components/content-blocks/document-media-context'

const fakeMedia = (url: string, alt: string): Media =>
  ({ id: 1, url, alt, width: 1600, height: 900, createdAt: '', updatedAt: '' }) as unknown as Media

describe('HeroView', () => {
  it('renders the title accessibly and the parallax image from document media', () => {
    const { container, getByAltText } = render(
      <DocumentMediaProvider background={fakeMedia('/api/media/file/bg.jpg', 'bg layer')}>
        <HeroView block={{ blockType: 'hero', title: 'Hero Title', description: 'Hero copy' }} />
      </DocumentMediaProvider>,
    )
    expect(container.querySelector('.sr-only')?.textContent).toBe('Hero Title')
    expect(getByAltText('bg layer')).toBeTruthy()
  })

  it('omits the image when the document has no background', () => {
    const { container } = render(
      <DocumentMediaProvider>
        <HeroView block={{ blockType: 'hero', title: 'No Image' }} />
      </DocumentMediaProvider>,
    )
    expect(container.querySelector('img')).toBeNull()
  })
})

describe('SummaryView', () => {
  it('renders the 1/3 and 2/3 columns', () => {
    const { container } = render(
      <SummaryView
        block={{
          blockType: 'summary',
          leftTitle: 'Left',
          leftBody: 'left body',
          rightTitle: 'Right',
          rightBody: 'right body',
        }}
      />,
    )
    const text = container.textContent ?? ''
    expect(text).toContain('Left')
    expect(text).toContain('left body')
    expect(text).toContain('Right')
    expect(text).toContain('right body')
  })
})

describe('StatsView', () => {
  it('renders each figure with its accessible value and label', () => {
    const { container } = render(
      <StatsView
        block={{
          blockType: 'stats',
          stats: [
            { value: '10Mil', label: 'Downloads' },
            { value: '98%', label: 'Satisfaction' },
          ],
        }}
      />,
    )
    const srOnly = Array.from(container.querySelectorAll('.sr-only')).map((n) => n.textContent)
    expect(srOnly).toContain('10Mil')
    expect(srOnly).toContain('98%')
    expect(container.textContent).toContain('Downloads')
    expect(container.textContent).toContain('Satisfaction')
  })

  it('renders nothing when there are no stats', () => {
    const { container } = render(<StatsView block={{ blockType: 'stats', stats: [] }} />)
    expect(container.querySelector('[data-block-type="stats"]')).toBeNull()
  })
})

describe('ImageSectionView', () => {
  it('renders the image', () => {
    const { getByAltText } = render(
      <ImageSectionView
        block={{ blockType: 'imageSection', image: fakeMedia('/api/media/file/x.jpg', 'a photo') }}
      />,
    )
    expect(getByAltText('a photo')).toBeTruthy()
  })

  it('renders nothing when the upload is unpopulated', () => {
    const { container } = render(<ImageSectionView block={{ blockType: 'imageSection', image: 5 }} />)
    expect(container.querySelector('[data-block-type="imageSection"]')).toBeNull()
  })
})

describe('DescriptionView', () => {
  it('renders the animated title', () => {
    const { container } = render(
      <DescriptionView block={{ blockType: 'description', title: 'Big Title', body: null }} />,
    )
    expect(container.querySelector('.sr-only')?.textContent).toBe('Big Title')
  })
})

describe('SectionTitleView', () => {
  it('renders the title and description', () => {
    const { container } = render(
      <SectionTitleView
        block={{ blockType: 'sectionTitle', title: 'Section', description: 'a description' }}
      />,
    )
    expect(container.querySelector('.sr-only')?.textContent).toBe('Section')
    expect(container.textContent).toContain('a description')
  })
})

describe('WelcomeIntroView', () => {
  it('renders title, role, and descriptor', () => {
    const { container } = render(
      <WelcomeIntroView
        block={{
          blockType: 'welcomeIntro',
          title: 'Dimm Kyselov',
          role: 'Product designer',
          descriptor: 'I prioritize data-driven design process.',
        }}
      />,
    )
    expect(container.querySelector('.sr-only')?.textContent).toBe('Dimm Kyselov')
    expect(container.textContent).toContain('Product designer')
    expect(container.textContent).toContain('data-driven design')
    expect(container.querySelector('h2')?.className).toContain('text-2xl')
    expect(container.querySelector('p')?.className).toContain('text-sm')
    expect(container.querySelectorAll('p')[1]?.className).toContain('max-w-80')
    expect(container.querySelectorAll('p')[1]?.className).toContain('bg-bgs')
  })
})

describe('InteractivePortraitView', () => {
  it('preserves the source SVG root fill mode so stroke paths do not fill black', () => {
    const { container } = render(<InteractivePortraitView block={{ blockType: 'interactivePortrait' }} />)
    const svg = container.querySelector('svg')

    expect(svg?.getAttribute('viewBox')).toBe('0 0 171 171')
    expect(svg?.getAttribute('width')).toBe('171')
    expect(svg?.getAttribute('height')).toBe('171')
    expect(svg?.getAttribute('fill')).toBe('none')
    expect(container.querySelectorAll('[data-look-index]')).toHaveLength(41)
    expect(svg?.parentElement?.className).toContain('h-32')
  })

  it('tracks pointer gaze on fine pointer devices', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))

    const { getByTestId } = render(<InteractivePortraitView block={{ blockType: 'interactivePortrait' }} />)
    const portrait = getByTestId('interactive-portrait')

    fireEvent.pointerMove(portrait, { clientX: 1000, clientY: 40 })

    await waitFor(() => {
      expect(Number(portrait.dataset.gazeX)).toBeGreaterThan(0)
      expect(portrait.dataset.gazeMode).toBe('pointer')
    })

    vi.unstubAllGlobals()
  })

  it('uses idle gaze when no fine pointer is available', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))

    const { getByTestId } = render(<InteractivePortraitView block={{ blockType: 'interactivePortrait' }} />)
    const portrait = getByTestId('interactive-portrait')

    await waitFor(() => {
      expect(portrait.dataset.gazeMode).toBe('idle')
    })

    vi.unstubAllGlobals()
  })
})
