import { Suspense } from 'react'
import type { Window } from '@/payload-types'
import { ArticleListRenderer } from './article-list-renderer'
import { RichTextView, ImageView, GalleryView, EmbedView, CtaView } from './views'

// Window['content'] and Article['content'] are the same union (shared block
// interfaceNames) — this single renderer serves both collections.
export type ContentBlock = NonNullable<Window['content']>[number]

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
    case 'image':
      return <ImageView block={block} />
    case 'gallery':
      return <GalleryView block={block} />
    case 'embed':
      return <EmbedView block={block} />
    case 'cta':
      return <CtaView block={block} />
    case 'articleList':
      return (
        <Suspense fallback={<div />}>
          <ArticleListRenderer block={block} />
        </Suspense>
      )
  }
}
