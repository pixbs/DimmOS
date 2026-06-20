import { getPayload } from 'payload'
import config from '@payload-config'
import type { ArticleListBlock } from '@/payload-types'
import { fetchArticleList } from '@/lib/articleList'
import { Works } from '@/components/content-blocks/works'

export async function ArticleListRenderer({ block }: { block: ArticleListBlock }) {
  const payload = await getPayload({ config })
  const articles = await fetchArticleList(block, payload)

  return (
    <div data-block-type="articleList" data-view-mode="grid" className="flex flex-col gap-3">
      {block.heading && <h2 className="text-lg font-semibold">{block.heading}</h2>}
      <Works items={articles} viewMode="grid" />
    </div>
  )
}
