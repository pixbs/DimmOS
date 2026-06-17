import 'server-only'
import type { getPayload } from 'payload'
import type { ArticleListBlock, Media } from '@/payload-types'

/** A resolved image layer for a Works card/preview (serializable for client components). */
export type WorksImage = {
  src: string
  alt: string
  width: number
  height: number
}

export type ArticleListItem = {
  id: string
  title: string
  slug: string
  shortcutIcon?: string | null
  /** Project year, shown in the Works table view. */
  year?: number | null
  /** Tag titles, shown in the Works table view. */
  tags: string[]
  /** Background parallax/card image (null when unset). */
  bgImage?: WorksImage | null
  /** Foreground parallax image (null when unset). */
  fgImage?: WorksImage | null
}

/** Resolve a Payload upload field value to a {@link WorksImage}, or `null` when unset/unpopulated. */
function toWorksImage(value: number | Media | null | undefined): WorksImage | null {
  if (!value || typeof value === 'number' || !value.url) return null
  return {
    src: value.url,
    alt: value.alt ?? '',
    width: value.width ?? 1600,
    height: value.height ?? 900,
  }
}

/**
 * Single source for resolving an articleList block to its article items.
 * Used by both the RSC renderer (ArticleListRenderer) and the window content
 * resolver (resolveBlocks in windowContent.ts).
 *
 * Resolves the per-article card/preview images, tag titles, and year used by
 * the Works grid and table views (depth 1 so uploads/relationships populate).
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
    select: {
      title: true,
      slug: true,
      shortcutIcon: true,
      year: true,
      tags: true,
      bgImage: true,
      fgImage: true,
    } as const,
    sort,
    depth: 1,
    limit: block.limit ?? 6,
    overrideAccess: false,
  })

  return docs.map((a) => ({
    id: String(a.id),
    title: a.title,
    slug: a.slug ?? '',
    shortcutIcon: a.shortcutIcon,
    year: a.year ?? null,
    tags: (a.tags ?? [])
      .map((t) => (typeof t === 'object' && t ? t.title : ''))
      .filter((t): t is string => Boolean(t)),
    bgImage: toWorksImage(a.bgImage),
    fgImage: toWorksImage(a.fgImage),
  }))
}
