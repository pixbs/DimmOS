'use client'

import { useEffect, useLayoutEffect, useRef, useState, Suspense, useTransition, useCallback } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import type { WindowContentResult } from '@/actions/getWindowContent'
import { WindowToolbarProvider } from './window-toolbar-context'
import { WindowToolbar } from './WindowToolbar'
import { WindowTitleBar } from './title-bar'
import { ResizeHandles } from './ResizeHandles'
import { ContentView } from './content-view'
import { promiseCache, getOrCreatePromise, seedPromise } from '@/lib/window-promise-cache'
import { loadSavedPosition, mergePositionToStorage, parsePx, type SavedPosition } from '@/lib/window-positions'
import { startPanelDrag } from '@/lib/window-drag'
import { ContentErrorBoundary } from './content-error-boundary'
import type { WindowBehaviorConfig } from '@/utilities/windowBehavior'

const DEFAULT_BEHAVIOR: WindowBehaviorConfig = {
  collapsible: true,
  expandable: false,
  resizable: true,
  displaySearch: false,
  displayViewToggle: false,
  defaultView: 'grid',
  displayHistory: false,
}

interface AdditionalWindowProps {
  rootSlug: string
  slug: string
  canGoBack: boolean
  canGoForward: boolean
  onNavigate: (slug: string) => void
  onBack: () => void
  onForward: () => void
  zIndex: number
  cascadeIndex: number
  pendingMinimize: boolean
  onClose: () => void
  onFocus: () => void
  onMinimize: () => void
  // Pre-rendering props — all optional; undefined = traditional mount/unmount behavior
  preloadedData?: WindowContentResult | null
  isVisible?: boolean
  onReady?: () => void
}

const CASCADE_STEP = 32

export function AdditionalWindow({
  rootSlug,
  slug,
  canGoBack,
  canGoForward,
  onNavigate,
  onBack,
  onForward,
  zIndex,
  cascadeIndex,
  pendingMinimize,
  onClose,
  onFocus,
  onMinimize,
  preloadedData,
  isVisible,
  onReady,
}: AdditionalWindowProps) {
  const isPreloaded = preloadedData !== undefined
  const storageKey = `secondary:${rootSlug}`

  // Pre-seed cache with SSR data before any state reads
  if (preloadedData !== undefined) seedPromise(rootSlug, preloadedData ?? null)

  // ── Promise management ───────────────────────────────────────────────────
  // Manager always calls getOrCreatePromise(newSlug) before updating slug on the window,
  // so promiseCache.get(slug) is valid during render for navigation-triggered changes.
  // The slug-snapshot pattern keeps currentPromise in sync synchronously (no stale render).
  const [slugSnapshot, setSlugSnapshot] = useState(slug)
  const [currentPromise, setCurrentPromise] = useState<Promise<WindowContentResult>>(
    () => promiseCache.get(slug) ?? new Promise<WindowContentResult>(() => {}),
  )

  if (slugSnapshot !== slug) {
    setSlugSnapshot(slug)
    const p = promiseCache.get(slug)
    if (p) setCurrentPromise(p)
  }

  // Fallback for cold cache (on-demand window session restore without preloadedData)
  useEffect(() => {
    if (!promiseCache.has(slug)) {
      setCurrentPromise(getOrCreatePromise(slug))
    }
  }, [slug])

  // ── Navigation with transition ────────────────────────────────────────────
  const [isPending, startTransition] = useTransition()
  const handleNavigate = (s: string) => startTransition(() => onNavigate(s))
  const handleBack     = ()          => startTransition(() => onBack())
  const handleForward  = ()          => startTransition(() => onForward())

  // ── Title / behavior — driven by ContentView onDataReady ─────────────────
  const [currentTitle, setCurrentTitle] = useState<string>(() => {
    if (preloadedData?.type === 'window') return preloadedData.title
    if (preloadedData?.type === 'article') return preloadedData.doc.title
    return rootSlug
  })
  const [currentBehavior, setCurrentBehavior] = useState<WindowBehaviorConfig>(
    () => preloadedData?.behavior ?? DEFAULT_BEHAVIOR,
  )

  const handleDataReady = useCallback(
    (data: WindowContentResult) => {
      if (data?.type === 'window') {
        setCurrentTitle(data.title)
        setCurrentBehavior(data.behavior)
      } else if (data?.type === 'article') {
        setCurrentTitle(data.doc.title)
        // Don't override currentBehavior — toolbar flags (displayHistory etc.) come from the root window
      } else if (data?.type === 'form') {
        setCurrentTitle(data.doc.title ?? slug)
        // Same: keep root window behavior
      } else {
        setCurrentTitle(slug.charAt(0).toUpperCase() + slug.slice(1))
        setCurrentBehavior(DEFAULT_BEHAVIOR)
      }
    },
    [slug],
  )

  // ── Window chrome state ───────────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const preExpandRef = useRef<SavedPosition | null>(null)

  const onMinimizeRef = useRef(onMinimize)
  onMinimizeRef.current = onMinimize
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const prevIsVisibleRef = useRef<boolean | undefined>(undefined)
  const controls = useAnimationControls()

  // ── onReady reporting — fires once on mount ───────────────────────────────
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  useEffect(() => {
    onReadyRef.current?.()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- preloader ready signal must fire exactly once per mount

  // ── 1. Restore saved position BEFORE first paint ──────────────────────────
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const saved = loadSavedPosition(storageKey)
    panel.style.setProperty('--win-x', `${saved.x ?? (80 + cascadeIndex * CASCADE_STEP)}px`)
    panel.style.setProperty('--win-y', `${saved.y ?? (60 + cascadeIndex * CASCADE_STEP)}px`)
    if (saved.w !== undefined) panel.style.setProperty('--win-w', `${saved.w}px`)
    if (saved.h !== undefined) panel.style.setProperty('--win-h', `${saved.h}px`)
  }, [storageKey, cascadeIndex])

  // ── 2. Open animation ─────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!isPreloaded) {
      runOpenAnimation()
      return
    }

    const wasVisible = prevIsVisibleRef.current
    prevIsVisibleRef.current = isVisible

    if (isVisible && wasVisible !== true) {
      runOpenAnimation()
    } else if (!isVisible && wasVisible !== undefined) {
      controls.set({ scale: 0.82, opacity: 0 })
    }
  }, [isVisible]) // eslint-disable-line react-hooks/exhaustive-deps -- only visibility transitions drive the open/close animation; controls is stable

  function runOpenAnimation() {
    const el = panelRef.current
    if (!el) return
    const btn = document.querySelector<HTMLElement>(`[data-window-id="${rootSlug}"]`)
    if (btn) {
      const elRect = el.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()
      const startX = btnRect.left + btnRect.width / 2 - (elRect.left + elRect.width / 2)
      const startY = btnRect.top + btnRect.height / 2 - (elRect.top + elRect.height / 2)
      controls.set({ x: startX, y: startY, scale: 0.08, opacity: 0 })
      controls.start({ x: 0, y: 0, scale: 1, opacity: 1, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } })
    } else {
      controls.set({ scale: 0.82, opacity: 0 })
      controls.start({ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 340, damping: 28, mass: 0.9 } })
    }
  }

  // ── 3. Collapse animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!pendingMinimize) return

    const el = panelRef.current
    const btn = document.querySelector<HTMLElement>(`[data-window-id="${rootSlug}"]`)

    if (!el || !btn) {
      onMinimizeRef.current()
      return
    }

    const elRect = el.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const targetX = btnRect.left + btnRect.width / 2 - (elRect.left + elRect.width / 2)
    const targetY = btnRect.top + btnRect.height / 2 - (elRect.top + elRect.height / 2)

    controls.start({
      x: targetX,
      y: targetY,
      scale: 0.08,
      opacity: 0,
      transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
    }).then(() => {
      onMinimizeRef.current()
    })
  }, [pendingMinimize, rootSlug]) // eslint-disable-line react-hooks/exhaustive-deps -- controls and onMinimizeRef are stable; only the minimize trigger matters

  async function handleClose() {
    await controls.start({ scale: 0.82, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } })
    onCloseRef.current()
  }

  function handleMinimizeButton() {
    const el = panelRef.current
    const btn = document.querySelector<HTMLElement>(`[data-window-id="${rootSlug}"]`)

    if (!el || !btn) {
      onMinimizeRef.current()
      return
    }

    const elRect = el.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const targetX = btnRect.left + btnRect.width / 2 - (elRect.left + elRect.width / 2)
    const targetY = btnRect.top + btnRect.height / 2 - (elRect.top + elRect.height / 2)

    controls.start({
      x: targetX,
      y: targetY,
      scale: 0.08,
      opacity: 0,
      transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
    }).then(() => {
      onMinimizeRef.current()
    })
  }

  function expand() {
    const panel = panelRef.current
    if (!panel) return
    const headerH = document.querySelector('header')?.offsetHeight ?? 40
    if (!isExpanded) {
      preExpandRef.current = {
        x: parsePx(panel, '--win-x', 80),
        y: parsePx(panel, '--win-y', 60),
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
        panel.style.setProperty('--win-y', `${prev.y ?? 60}px`)
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
    startPanelDrag(e, panel, {
      defaultX: 80,
      defaultY: 60,
      onDragEnd: (pos) => mergePositionToStorage(storageKey, pos),
    })
  }

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      data-window-panel=""
      data-state="open"
      data-secondary-window={rootSlug}
      style={{ '--win-z': String(zIndex) } as React.CSSProperties}
      onPointerDown={onFocus}
      className="w-full"
      animate={controls}
    >
      <WindowTitleBar
        title={currentTitle}
        onClose={handleClose}
        onMinimize={handleMinimizeButton}
        onExpand={expand}
        onPointerDown={handlePointerDown}
        disableMinimize={!currentBehavior.collapsible}
        expandable={currentBehavior.expandable}
        expanded={isExpanded}
      />

      <WindowToolbarProvider
        behavior={currentBehavior}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={handleBack}
        onForward={handleForward}
        onNavigate={handleNavigate}
      >
        <WindowToolbar />
        <div className={`flex-1 overflow-auto min-h-0 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
          <ContentErrorBoundary
            onRetry={() => setCurrentPromise(getOrCreatePromise(slug))}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-32 opacity-30 text-sm">Loading…</div>
              }
            >
              <ContentView
                key={slug}
                promise={currentPromise}
                onDataReady={handleDataReady}
                slug={slug}
              />
            </Suspense>
          </ContentErrorBoundary>
        </div>
      </WindowToolbarProvider>

      {currentBehavior.resizable && !isExpanded && (
        <ResizeHandles
          panelRef={panelRef}
          onResizeEnd={(w, h) => mergePositionToStorage(storageKey, { w, h })}
        />
      )}
    </motion.div>
  )
}
