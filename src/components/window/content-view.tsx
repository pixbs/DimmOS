'use client'

import { use, useEffect } from 'react'
import type { WindowContentResult, ResolvedBlock } from '@/actions/getWindowContent'
import { useWindowManagerContext } from './manager-context'
import { useWindowToolbar } from './window-toolbar-context'
import { BSODContent } from './BSODContent'
import { WindowScaffold } from './window-scaffold'
import { WindowButtons } from './window-buttons'
import { FormComponent } from '@/components/form/FormComponent'
import { RichTextView, ImageView, GalleryView, EmbedView, CtaView } from '@/components/content-blocks/views'
import type { Article } from '@/payload-types'

function ArticleListBlock({ block }: { block: ResolvedBlock & { blockType: 'articleList' } }) {
  const { open } = useWindowManagerContext()
  const { behavior, searchQuery, viewMode, navigate } = useWindowToolbar()

  const filtered = searchQuery
    ? block.articles.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : block.articles

  const handleClick = (slug: string) => {
    if (behavior.displayHistory) {
      navigate(slug)
    } else {
      open(slug)
    }
  }

  return (
    <div data-block-type="articleList" data-view-mode={viewMode} className="flex flex-col gap-2">
      {block.heading && <h2 className="text-lg font-semibold px-2">{block.heading}</h2>}
      {viewMode === 'grid' ? (
        <div className="flex flex-col gap-2">
          {filtered.map((a) => (
            <button
              key={a.id}
              data-article-item=""
              onClick={() => handleClick(a.slug)}
              className="flex items-center gap-3 rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors w-full text-left"
            >
              <i className={`${a.shortcutIcon ?? 'ri-folder-fill'} text-2xl`} />
              <span className="font-medium text-fg">{a.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col">
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                data-article-item=""
                onClick={() => handleClick(a.slug)}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/8 transition-colors text-left"
              >
                <i className={`${a.shortcutIcon ?? 'ri-folder-fill'} text-base text-fg/60`} />
                <span className="flex-1 text-sm text-fg">{a.title}</span>
                <i className="ri-arrow-right-s-line text-fg/30" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function BlockRenderer({ block }: { block: ResolvedBlock }) {
  switch (block.blockType) {
    case 'richText':
      return <RichTextView block={block} />
    case 'image':
      return <ImageView block={block} />
    case 'gallery':
      return <GalleryView block={block} />
    case 'embed':
      return <EmbedView block={block} />
    case 'cta':
      return <CtaView block={block} />
    case 'articleList':
      return <ArticleListBlock block={block} />
    default:
      return null
  }
}

function ArticleBlockContent({ article }: { article: Article }) {
  const blocks = (article.content ?? []) as ResolvedBlock[]
  const buttons = article.buttons ?? []
  return (
    <WindowScaffold footer={buttons.length ? <WindowButtons buttons={buttons} /> : undefined}>
      <div className="flex flex-col gap-6 px-6 py-8">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest opacity-40">
            {article.type === 'case-study' ? 'Case Study' : 'Service'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-fg">{article.title}</h1>
        {blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
      </div>
    </WindowScaffold>
  )
}

/**
 * Renders resolved window content from a pre-created promise.
 * Uses React 19 use() so the parent Suspense boundary handles loading.
 * Must be rendered with key={displaySlug} so each navigation mounts a fresh instance.
 * The promise must be created OUTSIDE render (in an event handler or hook initializer)
 * to avoid triggering Router state updates during the React render phase.
 */
export function ContentView({
  promise,
  onDataReady,
  slug,
}: {
  promise: Promise<WindowContentResult>
  onDataReady: (data: WindowContentResult) => void
  slug?: string
}) {
  const data = use(promise)

  useEffect(() => {
    onDataReady(data)
  }, [data, onDataReady])

  if (data === null) {
    return (
      <WindowScaffold>
        <BSODContent slug={slug} />
      </WindowScaffold>
    )
  }
  if (data.type === 'window') {
    return (
      <WindowScaffold footer={data.buttons.length ? <WindowButtons buttons={data.buttons} /> : undefined}>
        <div className="flex flex-col gap-6 px-6 py-8">
          {data.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      </WindowScaffold>
    )
  }
  if (data.type === 'article') {
    return <ArticleBlockContent article={data.doc} />
  }
  if (data.type === 'form') {
    return <FormComponent form={data.doc} />
  }
  return null
}
