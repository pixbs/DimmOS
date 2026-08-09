import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Works } from '@/components/content-blocks/works'
import type { ArticleListItem } from '@/lib/articleList'

const items: ArticleListItem[] = [
  {
    id: 'alpha',
    title: 'Alpha identity',
    slug: 'alpha-identity',
    shortcutIcon: 'ri-shapes-fill',
    year: 2026,
    tags: ['Branding', 'Web'],
  },
  {
    id: 'beta',
    title: 'Beta platform',
    slug: 'beta-platform',
    year: 2025,
    tags: [],
  },
]

describe('Works views', () => {
  it('renders an interactive grid and reports the selected article slug', async () => {
    const select = vi.fn()
    const screen = await render(<Works items={items} onSelect={select} />)

    await expect.element(screen.getByRole('heading', { name: 'Alpha identity' })).toBeVisible()
    await expect.element(screen.getByText('Branding')).toBeVisible()
    await screen.getByRole('button', { name: /Alpha identity/ }).click()
    expect(select).toHaveBeenCalledExactlyOnceWith('alpha-identity')
  })

  it('renders the table view with useful column and row semantics', async () => {
    const select = vi.fn()
    const screen = await render(<Works items={items} viewMode="table" onSelect={select} />)

    await expect.element(screen.getByRole('table')).toBeVisible()
    const titleHeader = await screen.getByText('Title', { exact: true }).element()
    expect(titleHeader.tagName).toBe('TH')
    await expect.element(screen.getByText('2025', { exact: true })).toBeVisible()
    await screen.getByRole('button', { name: 'Beta platform' }).click()
    expect(select).toHaveBeenCalledExactlyOnceWith('beta-platform')
  })

  it('falls back to navigable article links when no window callback is provided', async () => {
    const screen = await render(<Works items={items.slice(0, 1)} />)
    await expect.element(screen.getByRole('link', { name: /Alpha identity/ })).toHaveAttribute(
      'href',
      '/alpha-identity',
    )
  })
})
