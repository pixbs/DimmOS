import { Suspense } from 'react'
import type { Article } from '@/payload-types'
import { ArticleListRenderer } from './article-list-renderer'
import { RichTextView } from './views'
import {
  HeroView,
  SummaryView,
  StatsView,
  ImageSectionView,
  DescriptionView,
  SectionTitleView,
  WelcomeIntroView,
  InteractivePortraitView,
} from './sections'

// Article['content'] is the superset union (it includes the article-only Hero
// block); Window['content'] is a subset of it, so this single renderer type
// serves both collections.
export type ContentBlock = NonNullable<Article['content']>[number]

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </>
  )
}

function BlockRenderer({ block }: { block: ContentBlock }) {
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
      return (
        <Suspense fallback={<div />}>
          <ArticleListRenderer block={block} />
        </Suspense>
      )
    default:
      return null
  }
}
