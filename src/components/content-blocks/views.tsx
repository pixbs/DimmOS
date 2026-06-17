// Pure presentational per-block views — no directive, usable from both the
// server renderer (content-blocks/index.tsx) and the client renderer
// (window/content-view.tsx).
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { RichTextBlock } from '@/payload-types'

export function RichTextView({ block }: { block: RichTextBlock }) {
  return (
    <div data-block-type="richText" className="prose prose-invert max-w-none">
      {block.content && <RichText data={block.content} />}
    </div>
  )
}
