import { getPayload } from 'payload'
import config from '@payload-config'
import type { ArticleListBlock } from '@/payload-types'
import { fetchArticleList } from '@/lib/articleList'
import { OpenWindowLink } from '@/components/window/open-window-link'

export async function ArticleListRenderer({ block }: { block: ArticleListBlock }) {
  const payload = await getPayload({ config })
  const articles = await fetchArticleList(block, payload)

  return (
    <div data-block-type="articleList" className="flex flex-col gap-3">
      {block.heading && <h2 className="text-lg font-semibold">{block.heading}</h2>}
      {articles.map((article) => (
        <OpenWindowLink
          key={article.id}
          slug={article.slug}
          data-article-card
          className="flex items-center gap-3 rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors"
        >
          <span className="font-medium text-fg">{article.title}</span>
        </OpenWindowLink>
      ))}
    </div>
  )
}
