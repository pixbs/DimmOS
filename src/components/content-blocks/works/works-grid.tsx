'use client'

import type { ArticleListItem } from '@/lib/articleList'
import { ParallaxImagePair } from '@/components/animation'
import { WorksItemLink } from './item-link'
import { TagList } from './tag-list'

/**
 * Works grid view: a two-column grid of project cards. Each card shows the
 * article's bg/fg parallax image (de-pixelation reveal, foreground over
 * background) and falls back to the article's shortcut icon when it has no
 * image, with the title and coloured tag dots beneath. Stacks to one column on
 * narrow windows via container queries.
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
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 @lg:grid-cols-2">
        {items.map((a) => (
          <WorksItemLink
            key={a.id}
            slug={a.slug}
            onSelect={onSelect}
            className="flex w-full flex-col gap-4 text-left text-fg no-underline"
          >
            {a.bgImage ? (
              <ParallaxImagePair
                background={a.bgImage}
                foreground={a.fgImage}
                aspectClassName="aspect-square"
                strength={16}
                className="rounded-2xl"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-white/5 text-5xl text-fg/40">
                <i className={a.shortcutIcon ?? 'ri-folder-fill'} />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-bold leading-tight @lg:text-2xl">{a.title}</h3>
              <TagList tags={a.tags} />
            </div>
          </WorksItemLink>
        ))}
      </div>
    </div>
  )
}
