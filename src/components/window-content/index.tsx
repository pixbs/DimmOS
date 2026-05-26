import type { Window, Media } from '@/payload-types'
import { RichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'

type Block = NonNullable<Window['content']>[number]

export function WindowContent({ blocks }: { blocks: NonNullable<Window['content']> }) {
  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  )
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.blockType) {
    case 'richText':
      return (
        <div data-block-type="richText" className="prose prose-invert max-w-none">
          {block.content && <RichText data={block.content} />}
        </div>
      )

    case 'image': {
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

    case 'gallery':
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

    case 'embed':
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

    case 'cta':
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
}
