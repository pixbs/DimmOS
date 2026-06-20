import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import type { ArticleListItem } from '@/lib/articleList'
import { WorksGrid } from '@/components/content-blocks/works/works-grid'
import { WorksTable } from '@/components/content-blocks/works/works-table'

// Stub useScroll (jsdom can't drive its frameloop) — see sections spec.
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, useScroll: () => ({ scrollYProgress: actual.motionValue(0) }) }
})

const item = (over: Partial<ArticleListItem>): ArticleListItem => ({
  id: '1',
  title: 'Project One',
  slug: 'project-one',
  tags: [],
  ...over,
})

describe('WorksGrid', () => {
  it('renders the parallax image when the article has one', () => {
    const { getByAltText } = render(
      <WorksGrid
        items={[item({ bgImage: { src: '/api/media/file/bg.jpg', alt: 'bg', width: 1600, height: 900 } })]}
        onSelect={() => {}}
      />,
    )
    expect(getByAltText('bg')).toBeTruthy()
  })

  it('falls back to the shortcut icon when there is no image', () => {
    const { container } = render(
      <WorksGrid items={[item({ shortcutIcon: 'ri-rocket-fill' })]} onSelect={() => {}} />,
    )
    expect(container.querySelector('i.ri-rocket-fill')).toBeTruthy()
    expect(container.querySelector('img')).toBeNull()
  })

  it('calls onSelect with the slug when a card is clicked', () => {
    const onSelect = vi.fn()
    const { getByText } = render(
      <WorksGrid items={[item({ title: 'Clicked', slug: 'clicked' })]} onSelect={onSelect} />,
    )
    fireEvent.click(getByText('Clicked'))
    expect(onSelect).toHaveBeenCalledWith('clicked')
  })

  it('renders tag dots + labels on a card', () => {
    const { getByText } = render(
      <WorksGrid items={[item({ tags: ['web', 'research'] })]} onSelect={() => {}} />,
    )
    expect(getByText('web')).toBeTruthy()
    expect(getByText('research')).toBeTruthy()
  })
})

describe('WorksTable', () => {
  const items = [
    item({ id: '1', title: 'Alpha', slug: 'alpha', year: 2024, tags: ['branding', 'web'] }),
    item({
      id: '2',
      title: 'Beta',
      slug: 'beta',
      year: 2025,
      bgImage: { src: '/api/media/file/beta.jpg', alt: 'beta preview', width: 1600, height: 900 },
    }),
  ]

  it('renders title, tags and year for each row', () => {
    const { getByText, container } = render(<WorksTable items={items} onSelect={() => {}} />)
    expect(getByText('Alpha')).toBeTruthy()
    expect(getByText('branding')).toBeTruthy()
    expect(container.textContent).toContain('2024')
    expect(container.textContent).toContain('2025')
  })

  it('shows a hover preview image for a row that has an image', () => {
    const { getByText, queryByAltText, getByAltText } = render(
      <WorksTable items={items} onSelect={() => {}} />,
    )
    expect(queryByAltText('beta preview')).toBeNull()
    fireEvent.mouseEnter(getByText('Beta').closest('tr')!)
    expect(getByAltText('beta preview')).toBeTruthy()
  })
})
