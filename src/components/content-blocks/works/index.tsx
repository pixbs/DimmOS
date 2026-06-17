'use client'

import type { ArticleListItem } from '@/lib/articleList'
import { WorksGrid } from './works-grid'
import { WorksTable } from './works-table'

/**
 * Works ("article list") renderer shared by the server and client block
 * renderers. Picks the grid or table view; passes `onSelect` only from the
 * interactive client renderer (the server renderer falls back to links).
 */
export function Works({
  items,
  viewMode = 'grid',
  onSelect,
}: {
  items: ArticleListItem[]
  viewMode?: 'grid' | 'table'
  onSelect?: (slug: string) => void
}) {
  return viewMode === 'table' ? (
    <WorksTable items={items} onSelect={onSelect} />
  ) : (
    <WorksGrid items={items} onSelect={onSelect} />
  )
}

export { WorksGrid } from './works-grid'
export { WorksTable } from './works-table'
