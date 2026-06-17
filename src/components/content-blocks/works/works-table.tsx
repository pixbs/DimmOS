'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import type { ArticleListItem, WorksImage } from '@/lib/articleList'
import { EASE_OUT_QUAD } from '@/lib/easing'
import { WorksItemLink } from './item-link'

/** Horizontal offset (10rem) of the hover preview from the cursor. */
const PREVIEW_OFFSET_PX = 160

/**
 * Works table view: rows of title / tags / year. Hovering a row shows a preview
 * image pinned to the cursor — fixed 10rem to its left and dropping below it —
 * that fades in (opacity 0→100, ease-out-quad) and follows the mouse. Rows with
 * no image show no preview. The preview is desktop-only (hover-driven).
 */
export function WorksTable({
  items,
  onSelect,
}: {
  items: ArticleListItem[]
  onSelect?: (slug: string) => void
}) {
  const [preview, setPreview] = useState<WorksImage | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  return (
    <div data-view-mode="table">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-fg/10 text-left text-xs uppercase tracking-wide text-fg/40">
            <th className="py-2 pr-4 font-medium">Title</th>
            <th className="py-2 pr-4 font-medium">Tags</th>
            <th className="py-2 font-medium">Year</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr
              key={a.id}
              className="border-b border-fg/5"
              onMouseEnter={() => setPreview(a.bgImage ?? a.fgImage ?? null)}
              onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setPreview(null)}
            >
              <td className="py-2.5 pr-4">
                <WorksItemLink
                  slug={a.slug}
                  onSelect={onSelect}
                  className="font-medium text-fg no-underline transition-colors hover:text-brand"
                >
                  {a.title}
                </WorksItemLink>
              </td>
              <td className="py-2.5 pr-4">
                <span className="flex flex-wrap gap-1">
                  {a.tags.map((t) => (
                    <span key={t} className="rounded-full bg-white/8 px-2 py-0.5 text-xs text-fg/60">
                      {t}
                    </span>
                  ))}
                </span>
              </td>
              <td className="py-2.5 text-fg/60">{a.year ?? ''}</td>
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
            style={{ left: pos.x - PREVIEW_OFFSET_PX, top: pos.y }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_QUAD }}
          >
            <Image
              src={preview.src}
              alt={preview.alt}
              width={preview.width}
              height={preview.height}
              className="h-auto w-40 rounded-lg shadow-xl ring-1 ring-fg/10"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
