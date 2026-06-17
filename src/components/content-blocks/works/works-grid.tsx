'use client'

import type { ArticleListItem } from '@/lib/articleList'
import { ParallaxImagePair } from '@/components/animation'
import { WorksItemLink } from './item-link'

/**
 * Works grid view: image cards. Each card shows the article's bg/fg parallax
 * image (with the de-pixelation reveal) and falls back to the article's
 * shortcut icon when it has no image. Columns respond to the window width via
 * container queries.
 */
export function WorksGrid({
  items,
  onSelect,
}: {
  items: ArticleListItem[]
  onSelect?: (slug: string) => void
}) {
  return (
    <div data-view-mode="grid" className="@container">
      <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3">
        {items.map((a) => (
          <WorksItemLink
            key={a.id}
            slug={a.slug}
            onSelect={onSelect}
            className="flex w-full flex-col gap-2 rounded-xl bg-white/5 p-2 text-left text-fg no-underline transition-colors hover:bg-white/10"
          >
            {a.bgImage ? (
              <ParallaxImagePair
                background={a.bgImage}
                foreground={a.fgImage}
                strength={16}
                className="rounded-lg"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg bg-white/5 text-4xl text-fg/40">
                <i className={a.shortcutIcon ?? 'ri-folder-fill'} />
              </div>
            )}
            <span className="px-1 pb-1 font-medium">{a.title}</span>
          </WorksItemLink>
        ))}
      </div>
    </div>
  )
}
