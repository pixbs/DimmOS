import 'server-only'
import type { getPayload } from 'payload'
import type { ArticleListBlock } from '@/payload-types'

export type ArticleListItem = {
  id: string
  title: string
  slug: string
  shortcutIcon?: string | null
}

/**
 * Single source for resolving an articleList block to its article items.
 * Used by both the RSC renderer (ArticleListRenderer) and the window content
 * resolver (resolveBlocks in windowContent.ts).
 */
export async function fetchArticleList(
  block: ArticleListBlock,
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<ArticleListItem[]> {
  const types = block.types as ('case-study' | 'service')[] | null | undefined
  const field = block.sortField ?? 'createdAt'
  const sort = block.sortDirection === 'asc' ? field : `-${field}`

  const { docs } = await payload.find({
    collection: 'articles',
    where: types?.length ? { type: { in: types } } : {},
    select: { title: true, slug: true, shortcutIcon: true } as const,
    sort,
    depth: 0,
    limit: block.limit ?? 6,
    overrideAccess: false,
  })

  return docs.map((a) => ({
    id: String(a.id),
    title: a.title,
    slug: a.slug ?? '',
    shortcutIcon: a.shortcutIcon,
  }))
}
