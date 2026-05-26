import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import type { Window } from '@/payload-types'

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
  })

  return (
    <div data-block-type="articleList">
      {block.heading && <h2>{block.heading}</h2>}
      <ul>
        {docs.map((article) => (
          <li key={article.id}>
            <Link href={`/${article.slug}`} data-article-card>
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
