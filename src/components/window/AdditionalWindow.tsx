'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getWindowContent, type WindowContentResult, type ResolvedBlock } from '@/actions/getWindowContent'
import { WindowTitleBar } from './title-bar'
import { useWindowManagerContext } from './manager-context'
import { FormComponent } from '@/components/form/FormComponent'
import type { Article, Media } from '@/payload-types'

interface AdditionalWindowProps {
  slug: string
  zIndex: number
  minimized: boolean
  onClose: () => void
  onFocus: () => void
  onMinimize: () => void
}

function parsePx(el: HTMLElement, prop: string, fallback: number): number {
  const raw = el.style.getPropertyValue(prop)
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function BlockRenderer({ block }: { block: ResolvedBlock }) {
  const { open } = useWindowManagerContext()

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
    case 'articleList':
      return (
        <div data-block-type="articleList" className="flex flex-col gap-3">
          {block.heading && <h2 className="text-lg font-semibold">{block.heading}</h2>}
          {block.articles.map((a) => (
            <button
              key={a.id}
              onClick={() => open(a.slug)}
              className="flex items-center gap-3 rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors w-full text-left"
            >
              <i className={`${a.shortcutIcon ?? 'ri-folder-fill'} text-2xl`} />
              <span className="font-medium text-fg">{a.title}</span>
            </button>
          ))}
        </div>
      )
    default:
      return null
  }
}

function ArticleBlockContent({ article }: { article: Article }) {
  const blocks = (article.content ?? []) as ResolvedBlock[]
  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-widest opacity-40">
          {article.type === 'case-study' ? 'Case Study' : 'Service'}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-fg">{article.title}</h1>
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  )
}

export function AdditionalWindow({
  slug,
  zIndex,
  minimized,
  onClose,
  onFocus,
  onMinimize,
}: AdditionalWindowProps) {
  const [data, setData] = useState<WindowContentResult>(null)
  const [loading, setLoading] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getWindowContent(slug).then((result) => {
      setData(result)
      setLoading(false)
    })
  }, [slug])

  // Set position imperatively so React re-renders (e.g. zIndex change) never reset --win-x/--win-y
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    try {
      const positions = JSON.parse(localStorage.getItem('window-positions') ?? '{}') as Record<string, { x: number; y: number }>
      const saved = positions[`secondary:${slug}`]
      panel.style.setProperty('--win-x', `${saved?.x ?? 120}px`)
      panel.style.setProperty('--win-y', `${saved?.y ?? 80}px`)
    } catch {
      panel.style.setProperty('--win-x', '120px')
      panel.style.setProperty('--win-y', '80px')
    }
  }, [slug])

  function handlePointerDown(e: React.PointerEvent) {
    const panel = panelRef.current
    if (!panel) return
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const startWinX = parsePx(panel, '--win-x', 120)
    const startWinY = parsePx(panel, '--win-y', 80)

    panel.setPointerCapture(e.pointerId)
    panel.setAttribute('data-dragging', '')

    function onMove(ev: PointerEvent) {
      const maxX = window.innerWidth - (panel!.offsetWidth || 400)
      const maxY = window.innerHeight - (panel!.offsetHeight || 300)
      panel!.style.setProperty('--win-x', `${clamp(startWinX + ev.clientX - startX, 0, Math.max(0, maxX))}px`)
      panel!.style.setProperty('--win-y', `${clamp(startWinY + ev.clientY - startY, 0, Math.max(0, maxY))}px`)
    }

    function onUp() {
      panel!.removeEventListener('pointermove', onMove)
      panel!.removeEventListener('pointerup', onUp)
      panel!.removeAttribute('data-dragging')
      const x = parsePx(panel!, '--win-x', 120)
      const y = parsePx(panel!, '--win-y', 80)
      try {
        const positions = JSON.parse(localStorage.getItem('window-positions') ?? '{}') as Record<string, { x: number; y: number }>
        positions[`secondary:${slug}`] = { x, y }
        localStorage.setItem('window-positions', JSON.stringify(positions))
      } catch { /* ignore */ }
    }

    panel.addEventListener('pointermove', onMove)
    panel.addEventListener('pointerup', onUp)
  }

  const title = data?.type === 'window' ? data.title : data?.type === 'article' ? data.doc.title : slug

  if (minimized) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      data-window-panel=""
      data-state="open"
      data-secondary-window={slug}
      style={{ '--win-z': String(zIndex) } as React.CSSProperties}
      onPointerDown={onFocus}
      className="w-full"
    >
      <WindowTitleBar
        title={title}
        onClose={onClose}
        onMinimize={onMinimize}
        onPointerDown={handlePointerDown}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-32 opacity-30 text-sm">Loading…</div>
        )}
        {!loading && data === null && (
          <div className="px-6 py-8 opacity-40 text-sm">Content not found.</div>
        )}
        {!loading && data?.type === 'window' && (
          <div className="flex flex-col gap-6 px-6 py-8">
            {data.blocks.map((block, i) => (
              <BlockRenderer key={i} block={block} />
            ))}
          </div>
        )}
        {!loading && data?.type === 'article' && (
          <ArticleBlockContent article={data.doc} />
        )}
        {!loading && data?.type === 'form' && (
          <FormComponent form={data.doc as any} />
        )}
      </div>
    </div>
  )
}
