// Pure presentational per-block views — no directive, usable from both the
// server renderer (content-blocks/index.tsx) and the client renderer
// (window/content-view.tsx).
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type {
  Media,
  RichTextBlock,
  ImageBlock,
  GalleryBlock,
  EmbedBlock,
  CtaBlock,
} from '@/payload-types'

export function RichTextView({ block }: { block: RichTextBlock }) {
  return (
    <div data-block-type="richText" className="prose prose-invert max-w-none">
      {block.content && <RichText data={block.content} />}
    </div>
  )
}

export function ImageView({ block }: { block: ImageBlock }) {
  const media = block.image as Media
  return (
    <div data-block-type="image">
      {media?.url && (
        <Image
          src={media.url}
          alt={media.alt ?? ''}
          width={media.width ?? 800}
          height={media.height ?? 600}
          className="w-full rounded-lg object-cover"
        />
      )}
    </div>
  )
}

export function GalleryView({ block }: { block: GalleryBlock }) {
  return (
    <div data-block-type="gallery" className="grid grid-cols-2 gap-3">
      {block.images?.map((item, j) => {
        const media = item.image as Media | null
        return media?.url ? (
          <Image
            key={j}
            src={media.url}
            alt={media.alt ?? ''}
            width={media.width ?? 400}
            height={media.height ?? 300}
            className="w-full rounded-lg object-cover aspect-square"
          />
        ) : null
      })}
    </div>
  )
}

export function EmbedView({ block }: { block: EmbedBlock }) {
  return (
    <div data-block-type="embed" className="aspect-video w-full overflow-hidden rounded-lg">
      <iframe
        src={block.url}
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

export function CtaView({ block }: { block: CtaBlock }) {
  return (
    <div data-block-type="cta" className="flex flex-col gap-3 rounded-xl bg-white/5 p-6">
      <h2 className="text-xl font-semibold text-fg">{block.heading}</h2>
      {block.body && <p className="text-fg/60 text-sm leading-relaxed">{block.body}</p>}
      {block.link?.href && (
        <a
          href={block.link.href}
          target={block.link.openInNewTab ? '_blank' : undefined}
          rel={block.link.openInNewTab ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          {block.link.label ?? block.link.href}
        </a>
      )}
    </div>
  )
}
