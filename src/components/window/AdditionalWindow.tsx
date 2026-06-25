'use client'

import { useEffect, useState, Suspense, useTransition, useCallback } from 'react'
import type { WindowContentResult } from '@/actions/getWindowContent'
import { WindowToolbarProvider } from './window-toolbar-context'
import { WindowToolbar } from './WindowToolbar'
import { ContentView } from './content-view'
import { promiseCache, getOrCreatePromise, seedPromise } from '@/lib/window-promise-cache'
import { ContentErrorBoundary } from './content-error-boundary'
import { ManagedWindowShell } from './managed-window-shell'
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

  return (
    <ManagedWindowShell
      windowId={`content:${rootSlug}`}
      secondaryWindowId={rootSlug}
      title={currentTitle}
      zIndex={zIndex}
      cascadeIndex={cascadeIndex}
      pendingMinimize={pendingMinimize}
      storageKey={storageKey}
      behavior={currentBehavior}
      animationTargetId={rootSlug}
      isPreloaded={isPreloaded}
      isVisible={isVisible}
      onReady={onReady}
      onClose={onClose}
      onFocus={onFocus}
      onMinimize={onMinimize}
      attributes={{ 'data-content-window': rootSlug }}
    >
      <WindowToolbarProvider
        behavior={currentBehavior}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={handleBack}
        onForward={handleForward}
        onNavigate={handleNavigate}
      >
        <WindowToolbar />
        <div className={`flex-1 min-h-0 flex flex-col transition-opacity ${isPending ? 'opacity-60' : ''}`}>
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
    </ManagedWindowShell>
  )
}
