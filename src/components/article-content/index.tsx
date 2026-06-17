import type { Article } from '@/payload-types'
import { ContentBlocks } from '@/components/content-blocks'
import { DocumentMediaProvider } from '@/components/content-blocks/document-media-context'
import { WindowScaffold } from '@/components/window/window-scaffold'
import { WindowButtons } from '@/components/window/window-buttons'

export function ArticleContent({ article }: { article: Article }) {
  const buttons = article.buttons ?? []
  return (
    <WindowScaffold footer={buttons.length ? <WindowButtons buttons={buttons} /> : undefined}>
      {/* Hero sections read the article's bg/fg images from this provider. */}
      <DocumentMediaProvider background={article.bgImage} foreground={article.fgImage}>
        <div className="flex flex-col gap-6 px-6 py-8">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-widest text-fg/40">
              {article.type === 'case-study' ? 'Case Study' : 'Service'}
            </span>
            <h1 className="text-3xl font-bold text-fg">{article.title}</h1>
          </div>
          <ContentBlocks blocks={article.content ?? []} />
        </div>
      </DocumentMediaProvider>
    </WindowScaffold>
  )
}
