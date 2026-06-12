import type { Article } from '@/payload-types'
import { ContentBlocks } from '@/components/content-blocks'

export function ArticleContent({ article }: { article: Article }) {
  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-fg/40">
          {article.type === 'case-study' ? 'Case Study' : 'Service'}
        </span>
        <h1 className="text-3xl font-bold text-fg">{article.title}</h1>
      </div>
      <ContentBlocks blocks={article.content ?? []} />
    </div>
  )
}
