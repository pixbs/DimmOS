'use client'

import { use, useEffect } from 'react'
import type { WindowContentResult, ResolvedBlock } from '@/actions/getWindowContent'
import { useWindowManagerContext } from './manager-context'
import { useWindowToolbar } from './window-toolbar-context'
import { BSODContent } from './BSODContent'
import { WindowScaffold } from './window-scaffold'
import { WindowButtons } from './window-buttons'
import { FormComponent } from '@/components/form/FormComponent'
import { RichTextView } from '@/components/content-blocks/views'
import {
  HeroView,
  SummaryView,
  StatsView,
  ImageSectionView,
  DescriptionView,
  SectionTitleView,
  WelcomeIntroView,
  InteractivePortraitView,
} from '@/components/content-blocks/sections'
import { DocumentMediaProvider } from '@/components/content-blocks/document-media-context'
import { Works } from '@/components/content-blocks/works'
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
      {block.heading && <h2 className="px-2 text-lg font-semibold">{block.heading}</h2>}
      <Works items={filtered} viewMode={viewMode} onSelect={handleClick} />
    </div>
  )
}

function BlockRenderer({ block }: { block: ResolvedBlock }) {
  switch (block.blockType) {
    case 'richText':
      return <RichTextView block={block} />
    case 'hero':
      return <HeroView block={block} />
    case 'summary':
      return <SummaryView block={block} />
    case 'stats':
      return <StatsView block={block} />
    case 'imageSection':
      return <ImageSectionView block={block} />
    case 'description':
      return <DescriptionView block={block} />
    case 'sectionTitle':
      return <SectionTitleView block={block} />
    case 'welcomeIntro':
      return <WelcomeIntroView block={block} />
    case 'interactivePortrait':
      return <InteractivePortraitView block={block} />
    case 'articleList':
      return <ArticleListBlock block={block} />
    default:
      return null
  }
}

function ArticleBlockContent({ article, blocks }: { article: Article; blocks: ResolvedBlock[] }) {
  const buttons = article.buttons ?? []
  return (
    <WindowScaffold footer={buttons.length ? <WindowButtons buttons={buttons} /> : undefined}>
      {/* Hero sections read the article's bg/fg images from this provider. */}
      <DocumentMediaProvider background={article.bgImage} foreground={article.fgImage}>
        <div className="flex flex-col gap-6 px-6 py-8">
          {blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      </DocumentMediaProvider>
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
    return <ArticleBlockContent article={data.doc} blocks={data.blocks} />
  }
  if (data.type === 'form') {
    return <FormComponent form={data.doc} />
  }
  return null
}
