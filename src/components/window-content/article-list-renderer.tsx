import { getPayload } from 'payload'
import config from '@payload-config'
import type { Window } from '@/payload-types'
import { OpenWindowLink } from '@/components/window/open-window-link'

type ArticleListBlock = Extract<
  NonNullable<Window['content']>[number],
  { blockType: 'articleList' }
>

export async function ArticleListRenderer({ block }: { block: ArticleListBlock }) {
  const payload = await getPayload({ config })

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

  return (
    <div data-block-type="articleList" className="flex flex-col gap-3">
      {block.heading && <h2 className="text-lg font-semibold">{block.heading}</h2>}
      {docs.map((article) => (
        <OpenWindowLink
          key={article.id}
          slug={article.slug ?? ''}
          data-article-card
          className="flex items-center gap-3 rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors"
        >
          <span className="font-medium text-fg">{article.title}</span>
        </OpenWindowLink>
      ))}
    </div>
  )
}
