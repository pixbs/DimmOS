'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import type { ArticleListItem, WorksImage } from '@/lib/articleList'
import { EASE_OUT_QUAD } from '@/lib/easing'
import { WorksItemLink } from './item-link'
import { TagList } from './tag-list'

/** Preview size (≈18rem square) and how far it sits from the cursor. */
const PREVIEW_SIZE_PX = 288
const PREVIEW_DROP_PX = 20

type Preview = { cover: WorksImage; overlay: WorksImage | null }

/**
 * Works table view: rows of title / tags / year. Hovering a row shows a large
 * preview pinned near the cursor — the article's background cover with its
 * foreground layer drawn over it — that fades in (opacity 0→100, ease-out-quad)
 * and follows the mouse. Rows with no image show no preview. Desktop-only
 * (hover-driven).
 */
export function WorksTable({
  items,
  onSelect,
}: {
  items: ArticleListItem[]
  onSelect?: (slug: string) => void
}) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const previewFor = (a: ArticleListItem): Preview | null => {
    if (a.bgImage) return { cover: a.bgImage, overlay: a.fgImage ?? null }
    if (a.fgImage) return { cover: a.fgImage, overlay: null }
    return null
  }

  return (
    <div data-view-mode="table">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-fg/10 text-left text-xs uppercase tracking-wide text-fg/40">
            <th className="py-3 pr-4 font-medium">Title</th>
            <th className="py-3 pr-4 font-medium">Tags</th>
            <th className="py-3 font-medium">Year</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr
              key={a.id}
              className="border-b border-fg/5"
              onMouseEnter={() => setPreview(previewFor(a))}
              onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setPreview(null)}
            >
              <td className="py-4 pr-4">
                <WorksItemLink
                  slug={a.slug}
                  onSelect={onSelect}
                  className="text-lg font-bold leading-tight text-fg no-underline transition-colors hover:text-brand"
                >
                  {a.title}
                </WorksItemLink>
              </td>
              <td className="py-4 pr-4">
                <TagList tags={a.tags} />
              </td>
              <td className="py-4 text-fg/50">{a.year ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <AnimatePresence>
        {preview && (
          <motion.div
            key="works-preview"
            aria-hidden
            className="pointer-events-none fixed z-50 hidden md:block"
            style={{ left: pos.x - PREVIEW_SIZE_PX / 2, top: pos.y + PREVIEW_DROP_PX }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_QUAD }}
          >
            <div className="relative aspect-square w-72 overflow-hidden rounded-xl shadow-2xl ring-1 ring-fg/10">
              <Image src={preview.cover.src} alt={preview.cover.alt} fill sizes="288px" className="object-cover" />
              {preview.overlay && (
                <Image src={preview.overlay.src} alt="" fill sizes="288px" className="object-contain" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
