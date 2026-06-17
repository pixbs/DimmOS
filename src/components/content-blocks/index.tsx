import { Suspense } from 'react'
import type { Article } from '@/payload-types'
import { ArticleListRenderer } from './article-list-renderer'
import { RichTextView } from './views'

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
    case 'articleList':
      return (
        <Suspense fallback={<div />}>
          <ArticleListRenderer block={block} />
        </Suspense>
      )
    default:
      // Section blocks (hero/summary/stats/imageSection/description/sectionTitle)
      // are rendered in a later phase.
      return null
  }
}
