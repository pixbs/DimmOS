'use client'

import { useEffect, useMemo, useRef } from 'react'

import { useShortcutRegistry } from '@/components/shortcut/registry-context'
import { useWindowManagerContext } from '@/components/window/manager-context'
import { systemWindowRegistry } from '@/components/window/system-window-registry'

type HeadWindowMeta = {
  color: string
  documentTitle: string
  icon: string
}

function parseCssContent(content: string): string {
  if (!content || content === 'none' || content === 'normal') return ''

  const unquoted = /^['"].*['"]$/.test(content) ? content.slice(1, -1) : content
  return unquoted
    .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_match, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/\\(.)/g, '$1')
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if ('roundRect' in ctx) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.closePath()
    return
  }

  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function getIconGlyph(icon: string): { fontFamily: string; glyph: string } {
  const probe = document.createElement('i')
  probe.className = icon
  probe.style.left = '-9999px'
  probe.style.position = 'absolute'
  probe.style.top = '-9999px'
  document.body.appendChild(probe)

  try {
    const before = window.getComputedStyle(probe, '::before')
    const glyph = parseCssContent(before.content)
    const fontFamily = before.fontFamily || window.getComputedStyle(probe).fontFamily || 'remixicon'
    return { fontFamily, glyph: glyph || 'D' }
  } finally {
    probe.remove()
  }
}

async function createFaviconDataUrl(meta: HeadWindowMeta): Promise<string | null> {
  if (!document.body) return null

  await document.fonts?.ready.catch(() => undefined)

  const { fontFamily, glyph } = getIconGlyph(meta.icon)
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.height = size
  canvas.width = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, size, size)
  roundRect(ctx, 6, 6, 52, 52, 12)
  ctx.fillStyle = meta.color
  ctx.fill()

  ctx.fillStyle = '#070707'
  ctx.font = `40px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(glyph, size / 2, size / 2 + 1)

  return canvas.toDataURL('image/png')
}

function getIconLink(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
}

export function WindowHeadSync() {
  const { windows } = useWindowManagerContext()
  const registry = useShortcutRegistry()
  const managedIconRef = useRef<HTMLLinkElement | null>(null)
  const originalIconHrefRef = useRef<string | null | undefined>(undefined)
  const originalTitleRef = useRef<string | null>(null)

  const activeMeta = useMemo<HeadWindowMeta | null>(() => {
    const activeWindow = windows
      .filter((win) => !win.minimized)
      .reduce<null | (typeof windows)[number]>((top, win) => {
        if (!top || win.zIndex > top.zIndex) return win
        return top
      }, null)

    if (!activeWindow) return null

    if (activeWindow.kind === 'system' && activeWindow.systemKey) {
      const entry = systemWindowRegistry[activeWindow.systemKey]
      return { color: entry.color, documentTitle: entry.title, icon: entry.icon }
    }

    if (activeWindow.kind === 'content') {
      const meta = registry.get(activeWindow.slug) ?? registry.get(activeWindow.rootSlug)
      if (meta) {
        return {
          color: meta.color,
          documentTitle: meta.documentTitle ?? meta.title,
          icon: meta.icon,
        }
      }
    }

    return null
  }, [registry, windows])

  const faviconKey = activeMeta ? `${activeMeta.color}:${activeMeta.icon}` : ''
  const documentTitle = activeMeta?.documentTitle ?? null

  useEffect(() => {
    let cancelled = false

    async function syncFavicon() {
      if (!activeMeta) {
        const managedIcon = managedIconRef.current
        if (!managedIcon) return

        if (originalIconHrefRef.current === undefined) {
          managedIcon.remove()
        } else {
          managedIcon.href = originalIconHrefRef.current ?? ''
          managedIcon.removeAttribute('data-dimm-dynamic-favicon')
        }
        managedIconRef.current = null
        return
      }

      const href = await createFaviconDataUrl(activeMeta)
      if (!href || cancelled) return

      let iconLink = managedIconRef.current ?? getIconLink()
      if (!iconLink) {
        iconLink = document.createElement('link')
        iconLink.rel = 'icon'
        document.head.appendChild(iconLink)
        originalIconHrefRef.current = undefined
      } else if (managedIconRef.current !== iconLink) {
        originalIconHrefRef.current = iconLink.getAttribute('href')
      }

      iconLink.type = 'image/png'
      iconLink.href = href
      iconLink.setAttribute('data-dimm-dynamic-favicon', '')
      managedIconRef.current = iconLink
    }

    syncFavicon()

    return () => {
      cancelled = true
    }
  }, [activeMeta, faviconKey])

  useEffect(() => {
    originalTitleRef.current ??= document.title

    if (documentTitle) {
      document.title = documentTitle
      return
    }

    document.title = originalTitleRef.current
  }, [documentTitle])

  return null
}
