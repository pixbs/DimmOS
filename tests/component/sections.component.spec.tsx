import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
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
