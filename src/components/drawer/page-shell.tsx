'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { DrawerContext } from './context'
import { WindowTitleBar } from '@/components/window/title-bar'
import { useWindowTitle } from '@/components/window/title-context'
import { useWindowManagerContext } from '@/components/window/manager-context'
import { ResizeHandles } from '@/components/window/ResizeHandles'
import { BASE_Z } from '@/hooks/useWindowManager'

interface PageDrawerShellProps {
  children: ReactNode
  title?: string
}

function parsePx(el: HTMLElement, prop: string, fallback: number): number {
  const raw = el.style.getPropertyValue(prop)
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

type SavedPosition = { x?: number; y?: number; w?: number; h?: number }

function loadSavedPosition(slug: string): SavedPosition {
  try {
    return (JSON.parse(localStorage.getItem('window-positions') ?? '{}') as Record<string, SavedPosition>)[slug] ?? {}
  } catch {
    return {}
  }
}

function mergePositionToStorage(slug: string, updates: Partial<SavedPosition>) {
  try {
    const all = JSON.parse(localStorage.getItem('window-positions') ?? '{}') as Record<string, SavedPosition>
    all[slug] = { ...all[slug], ...updates }
    localStorage.setItem('window-positions', JSON.stringify(all))
  } catch { /* ignore */ }
}

export function PageDrawerShell({ children, title: titleProp = '' }: PageDrawerShellProps) {
  const { title: contextTitle, disableMinimize, resizable, expandable } = useWindowTitle()
  const title = contextTitle || titleProp

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const preExpandRef = useRef<SavedPosition | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const slug = pathname.replace(/^\//, '') || 'home'

  const { windows, focus, minimize } = useWindowManagerContext()
  const win = windows.find((w) => w.slug === slug)
  const winZ = win?.zIndex ?? BASE_Z
  const winMinimized = win?.minimized ?? false

  function close() {
    setIsOpen(false)
    setTimeout(() => router.push('/'), 300)
  }

  function open() {
    setIsOpen(true)
  }

  function expand() {
    const panel = panelRef.current
    if (!panel) return
    const headerH = document.querySelector('header')?.offsetHeight ?? 40
    if (!isExpanded) {
      preExpandRef.current = {
        x: parsePx(panel, '--win-x', 80),
        y: parsePx(panel, '--win-y', 40),
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
        panel.style.setProperty('--win-x', `${prev.x ?? 80}px`)
        panel.style.setProperty('--win-y', `${prev.y ?? 40}px`)
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

  useEffect(() => { setIsOpen(true) }, [])

  useEffect(() => {
    if (window.innerWidth < 1024) {
      document.body.dataset.pageDrawer = isOpen ? 'open' : 'closed'
    }
    document.body.style.removeProperty('--drawer-open-pct')
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (window.innerWidth < 1024) {
        delete document.body.dataset.pageDrawer
      }
    }
  }, [])

  // Remove data-page-drawer from body when viewport grows to desktop — prevents stale header tinting
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) {
        delete document.body.dataset.pageDrawer
        document.body.style.removeProperty('--drawer-open-pct')
      }
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Restore saved position and size on desktop mount
  useEffect(() => {
    if (window.innerWidth < 1024) return
    const panel = panelRef.current
    if (!panel) return
    const saved = loadSavedPosition(slug)
    if (saved.x !== undefined) panel.style.setProperty('--win-x', `${saved.x}px`)
    if (saved.y !== undefined) panel.style.setProperty('--win-y', `${saved.y}px`)
    if (saved.w !== undefined) panel.style.setProperty('--win-w', `${saved.w}px`)
    if (saved.h !== undefined) panel.style.setProperty('--win-h', `${saved.h}px`)
  }, [slug])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const panel = panelRef.current
    if (!panel) return
    e.preventDefault()

    const isDesktop = window.innerWidth >= 1024
    const startX = e.clientX
    const startY = e.clientY
    const startWinX = isDesktop ? parsePx(panel, '--win-x', 80) : 0
    const startWinY = isDesktop ? parsePx(panel, '--win-y', 40) : 0
    let mobileOffset = 0

    panel.setPointerCapture(e.pointerId)
    panel.setAttribute('data-dragging', '')
    if (!isDesktop) {
      document.body.dataset.pageDrawer = 'dragging'
      document.body.style.setProperty('--drawer-open-pct', '100%')
    }

    function onMove(ev: PointerEvent) {
      if (isDesktop) {
        const maxX = window.innerWidth - (panel!.offsetWidth || 400)
        const maxY = window.innerHeight - (panel!.offsetHeight || 300)
        panel!.style.setProperty('--win-x', `${clamp(startWinX + ev.clientX - startX, 0, Math.max(0, maxX))}px`)
        panel!.style.setProperty('--win-y', `${clamp(startWinY + ev.clientY - startY, 0, Math.max(0, maxY))}px`)
      } else {
        mobileOffset = Math.max(0, ev.clientY - startY)
        const pct = Math.max(0, (1 - mobileOffset / (panel!.offsetHeight || 400)) * 100)
        document.body.style.setProperty('--drawer-open-pct', `${pct}%`)
        panel!.style.transform = `translateY(${mobileOffset}px)`
        panel!.style.transition = 'none'
      }
    }

    function onUp() {
      panel!.removeEventListener('pointermove', onMove)
      panel!.removeEventListener('pointerup', onUp)
      panel!.removeAttribute('data-dragging')

      if (isDesktop) {
        mergePositionToStorage(slug, {
          x: parsePx(panel!, '--win-x', 80),
          y: parsePx(panel!, '--win-y', 40),
        })
      } else {
        const willClose = mobileOffset > (panel!.offsetHeight || 400) * 0.25
        panel!.style.transform = ''
        panel!.style.transition = ''
        document.body.style.removeProperty('--drawer-open-pct')
        document.body.dataset.pageDrawer = willClose ? 'closed' : 'open'
        panel!.setAttribute('data-state', willClose ? 'closed' : 'open')
        if (willClose) close()
      }
    }

    panel.addEventListener('pointermove', onMove)
    panel.addEventListener('pointerup', onUp)
  }

  return (
    <DrawerContext.Provider value={{ close, open }}>
      {/* Mobile backdrop overlay — hidden on desktop */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 z-20 pointer-events-none bg-bgs flex flex-col lg:hidden"
        style={{
          top: 'var(--header-height)',
          opacity: 'var(--drawer-open-pct)',
        }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        data-testid="page-drawer"
        data-window-panel=""
        data-state={(isOpen && !winMinimized) ? 'open' : 'closed'}
        style={{ '--win-z': String(winZ) } as React.CSSProperties}
        onPointerDown={() => focus(slug)}
      >
        <WindowTitleBar
          title={title}
          onClose={close}
          onMinimize={() => minimize(slug)}
          onExpand={expand}
          onPointerDown={handlePointerDown}
          disableMinimize={disableMinimize}
          expandable={expandable}
          expanded={isExpanded}
        />

        <div
          className="win-draghandle justify-center pt-3 pb-6 cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={handlePointerDown}
        >
          <div className="w-20 h-1 rounded-full bg-fg/20" />
        </div>

        <div className="flex-1 overflow-auto min-h-0">{children}</div>

        {resizable && !isExpanded && (
          <ResizeHandles
            panelRef={panelRef}
            onResizeEnd={(w, h) => mergePositionToStorage(slug, { w, h })}
          />
        )}
      </div>
    </DrawerContext.Provider>
  )
}
