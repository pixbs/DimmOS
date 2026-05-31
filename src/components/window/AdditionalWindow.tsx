'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getWindowContent, type WindowContentResult, type ResolvedBlock } from '@/actions/getWindowContent'
import type { WindowBehaviorConfig } from '@/utilities/windowBehavior'
import { WindowTitleBar } from './title-bar'
import { ResizeHandles } from './ResizeHandles'
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

const DEFAULT_BEHAVIOR: WindowBehaviorConfig = { collapsible: true, expandable: false, resizable: true }

function parsePx(el: HTMLElement, prop: string, fallback: number): number {
  const raw = el.style.getPropertyValue(prop)
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

type SavedPosition = { x?: number; y?: number; w?: number; h?: number }

function mergePositionToStorage(key: string, updates: Partial<SavedPosition>) {
  try {
    const all = JSON.parse(localStorage.getItem('window-positions') ?? '{}') as Record<string, SavedPosition>
    all[key] = { ...all[key], ...updates }
    localStorage.setItem('window-positions', JSON.stringify(all))
  } catch { /* ignore */ }
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
  const [isExpanded, setIsExpanded] = useState(false)
  const preExpandRef = useRef<SavedPosition | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const storageKey = `secondary:${slug}`

  const behavior: WindowBehaviorConfig = data ? data.behavior : DEFAULT_BEHAVIOR

  useEffect(() => {
    getWindowContent(slug).then((result) => {
      setData(result)
      setLoading(false)
    })
  }, [slug])

  // Restore saved position and size (imperative — avoids React re-render resetting CSS vars)
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    try {
      const saved = (JSON.parse(localStorage.getItem('window-positions') ?? '{}') as Record<string, SavedPosition>)[storageKey]
      panel.style.setProperty('--win-x', `${saved?.x ?? 120}px`)
      panel.style.setProperty('--win-y', `${saved?.y ?? 80}px`)
      if (saved?.w !== undefined) panel.style.setProperty('--win-w', `${saved.w}px`)
      if (saved?.h !== undefined) panel.style.setProperty('--win-h', `${saved.h}px`)
    } catch {
      panel.style.setProperty('--win-x', '120px')
      panel.style.setProperty('--win-y', '80px')
    }
  }, [slug, storageKey])

  function expand() {
    const panel = panelRef.current
    if (!panel) return
    const headerH = document.querySelector('header')?.offsetHeight ?? 40
    if (!isExpanded) {
      preExpandRef.current = {
        x: parsePx(panel, '--win-x', 120),
        y: parsePx(panel, '--win-y', 80),
        w: panel.offsetWidth,
        h: panel.offsetHeight,
      }
      panel.style.setProperty('--win-x', '0px')
      panel.style.setProperty('--win-y', '0px')
      panel.style.setProperty('--win-w', `${window.innerWidth}px`)
      panel.style.setProperty('--win-h', `${window.innerHeight - headerH}px`)
    } else {
      const prev = preExpandRef.current
      if (prev) {
        panel.style.setProperty('--win-x', `${prev.x ?? 120}px`)
        panel.style.setProperty('--win-y', `${prev.y ?? 80}px`)
        if (prev.w !== undefined) panel.style.setProperty('--win-w', `${prev.w}px`)
        else panel.style.removeProperty('--win-w')
        if (prev.h !== undefined) panel.style.setProperty('--win-h', `${prev.h}px`)
        else panel.style.removeProperty('--win-h')
      } else {
        panel.style.removeProperty('--win-x')
        panel.style.removeProperty('--win-y')
        panel.style.removeProperty('--win-w')
        panel.style.removeProperty('--win-h')
      }
    }
    setIsExpanded((v) => !v)
  }

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
      mergePositionToStorage(storageKey, {
        x: parsePx(panel!, '--win-x', 120),
        y: parsePx(panel!, '--win-y', 80),
      })
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
        onExpand={expand}
        onPointerDown={handlePointerDown}
        disableMinimize={!behavior.collapsible}
        expandable={behavior.expandable}
        expanded={isExpanded}
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

      {behavior.resizable && !isExpanded && (
        <ResizeHandles
          panelRef={panelRef}
          onResizeEnd={(w, h) => mergePositionToStorage(storageKey, { w, h })}
        />
      )}
    </div>
  )
}
