'use client'

import { useEffect, useRef, useState, Suspense, useTransition, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { DrawerContext } from './context'
import { WindowTitleBar } from '@/components/window/title-bar'
import { useWindowTitle } from '@/components/window/title-context'
import { useWindowManagerContext } from '@/components/window/manager-context'
import { WindowToolbarProvider } from '@/components/window/window-toolbar-context'
import { WindowToolbar } from '@/components/window/WindowToolbar'
import { ResizeHandles } from '@/components/window/ResizeHandles'
import { ContentView } from '@/components/window/content-view'
import { ContentErrorBoundary } from '@/components/window/content-error-boundary'
import { BASE_Z } from '@/hooks/useWindowManager'
import { promiseCache, getOrCreatePromise } from '@/lib/window-promise-cache'
import { isDesktopViewport } from '@/lib/breakpoints'
import { loadSavedPosition, mergePositionToStorage, parsePx, type SavedPosition } from '@/lib/window-positions'
import { startPanelDrag } from '@/lib/window-drag'
import type { WindowContentResult } from '@/actions/getWindowContent'
import type { ReactNode } from 'react'

interface PageDrawerShellProps {
  children: ReactNode
  title?: string
}

export function PageDrawerShell({ children, title: titleProp = '' }: PageDrawerShellProps) {
  const {
    title: contextTitle, disableMinimize, resizable, expandable,
    displaySearch, displayViewToggle, defaultView, displayHistory,
  } = useWindowTitle()

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const preExpandRef = useRef<SavedPosition | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const slug = pathname.replace(/^\//, '') || 'home'

  const { windows, focus, minimize, actualMinimize, navigateInWindow, backInWindow, forwardInWindow } = useWindowManagerContext()
  const win = windows.find((w) => w.rootSlug === slug)
  const winZ = win?.zIndex ?? BASE_Z
  const winMinimized = win?.minimized ?? false

  useEffect(() => {
    if (win?.pendingMinimize) actualMinimize(slug)
  }, [win?.pendingMinimize, slug, actualMinimize])

  const currentSlug = win?.slug ?? slug
  const isAtRoot = currentSlug === slug
  const canGoBack    = (win?.historyIndex ?? 0) > 0
  const canGoForward = (win?.historyIndex ?? 0) < (win?.historyStack.length ?? 1) - 1

  // ── Promise management for navigated content ──────────────────────────────
  const [currentSlugSnapshot, setCurrentSlugSnapshot] = useState(currentSlug)
  const [currentPromise, setCurrentPromise] = useState<Promise<WindowContentResult>>(
    () => promiseCache.get(currentSlug) ?? new Promise<WindowContentResult>(() => {}),
  )

  if (currentSlugSnapshot !== currentSlug) {
    setCurrentSlugSnapshot(currentSlug)
    const p = promiseCache.get(currentSlug)
    if (p) setCurrentPromise(p)
  }

  useEffect(() => {
    if (!isAtRoot && !promiseCache.has(currentSlug)) {
      setCurrentPromise(getOrCreatePromise(currentSlug))
    }
  }, [currentSlug, isAtRoot])

  // ── Navigation with transition ────────────────────────────────────────────
  const [isPending, startTransition] = useTransition()
  const handleNavigate = useCallback(
    (s: string) => startTransition(() => navigateInWindow(slug, s)),
    [slug, navigateInWindow],
  )
  const handleBack    = useCallback(() => startTransition(() => backInWindow(slug)), [slug, backInWindow])
  const handleForward = useCallback(() => startTransition(() => forwardInWindow(slug)), [slug, forwardInWindow])

  // ── Title — driven by ContentView onDataReady when navigated ──────────────
  const [navTitle, setNavTitle] = useState('')
  const title = isAtRoot ? (contextTitle || titleProp) : navTitle

  const handleDataReady = useCallback(
    (data: WindowContentResult) => {
      if (data?.type === 'article') setNavTitle(data.doc.title)
      else if (data?.type === 'window') setNavTitle(data.title)
      else if (data?.type === 'form') setNavTitle(data.doc.title ?? currentSlug)
      else setNavTitle(currentSlug)
    },
    [currentSlug],
  )

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
    if (!isDesktopViewport()) {
      document.body.dataset.pageDrawer = isOpen ? 'open' : 'closed'
    }
    document.body.style.removeProperty('--drawer-open-pct')
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (!isDesktopViewport()) {
        delete document.body.dataset.pageDrawer
      }
    }
  }, [])

  // Remove data-page-drawer from body when viewport grows to desktop — prevents stale header tinting
  useEffect(() => {
    function onResize() {
      if (isDesktopViewport()) {
        delete document.body.dataset.pageDrawer
        document.body.style.removeProperty('--drawer-open-pct')
      }
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Restore saved position and size on desktop mount
  useEffect(() => {
    if (!isDesktopViewport()) return
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- document-level Escape listener registered once; close identity is irrelevant
  }, [])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const panel = panelRef.current
    if (!panel) return

    if (isDesktopViewport()) {
      startPanelDrag(e, panel, {
        defaultX: 80,
        defaultY: 40,
        onDragEnd: (pos) => mergePositionToStorage(slug, pos),
      })
      return
    }

    // Mobile sheet drag-to-dismiss — surface-specific (--drawer-open-pct lerp,
    // 25% dismiss threshold), intentionally not part of the shared drag helper.
    e.preventDefault()
    const startY = e.clientY
    let mobileOffset = 0

    panel.setPointerCapture(e.pointerId)
    panel.setAttribute('data-dragging', '')
    document.body.dataset.pageDrawer = 'dragging'
    document.body.style.setProperty('--drawer-open-pct', '100%')

    function onMove(ev: PointerEvent) {
      mobileOffset = Math.max(0, ev.clientY - startY)
      const pct = Math.max(0, (1 - mobileOffset / (panel!.offsetHeight || 400)) * 100)
      document.body.style.setProperty('--drawer-open-pct', `${pct}%`)
      panel!.style.transform = `translateY(${mobileOffset}px)`
      panel!.style.transition = 'none'
    }

    function onUp() {
      panel!.removeEventListener('pointermove', onMove)
      panel!.removeEventListener('pointerup', onUp)
      panel!.removeAttribute('data-dragging')

      const willClose = mobileOffset > (panel!.offsetHeight || 400) * 0.25
      panel!.style.transform = ''
      panel!.style.transition = ''
      document.body.style.removeProperty('--drawer-open-pct')
      document.body.dataset.pageDrawer = willClose ? 'closed' : 'open'
      panel!.setAttribute('data-state', willClose ? 'closed' : 'open')
      if (willClose) close()
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
        className="backdrop-blur-lg"
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

        <WindowToolbarProvider
          behavior={{ displaySearch, displayViewToggle, defaultView, displayHistory }}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={handleBack}
          onForward={handleForward}
          onNavigate={handleNavigate}
        >
          <WindowToolbar />
          <div
            className={`flex-1 overflow-auto min-h-0 bg-bg rounded-2xl transition-opacity ${isPending ? 'opacity-60' : ''}`}
          >
            {isAtRoot ? (
              children
            ) : (
              <ContentErrorBoundary
                onRetry={() => setCurrentPromise(getOrCreatePromise(currentSlug))}
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-32 opacity-30 text-sm">Loading…</div>
                  }
                >
                  <ContentView
                    key={currentSlug}
                    promise={currentPromise}
                    onDataReady={handleDataReady}
                  />
                </Suspense>
              </ContentErrorBoundary>
            )}
          </div>
        </WindowToolbarProvider>

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
