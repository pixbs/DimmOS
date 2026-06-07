'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useWindowManager } from '@/hooks/useWindowManager'
import { WindowManagerContextProvider } from './manager-context'
import { AdditionalWindow } from './AdditionalWindow'
import { Taskbar } from '@/components/taskbar'
import { PreloaderProvider, usePreloader } from '@/components/preloader/preloader-context'
import { PagePreloader } from '@/components/preloader/PagePreloader'
import type { WindowContentResult } from '@/lib/windowContent'

interface WindowManagerProviderProps {
  children: ReactNode
  preloadedContents?: Record<string, WindowContentResult>
  shortcutSlugs?: string[]
}

const BASE_Z = 50

export function WindowManagerProvider({
  children,
  preloadedContents = {},
  shortcutSlugs = [],
}: WindowManagerProviderProps) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    function check() {
      setIsDesktop(window.innerWidth >= 1024)
    }
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  const total = isDesktop === null ? null : isDesktop ? shortcutSlugs.length : 0

  return (
    <PreloaderProvider total={total}>
      <WindowManagerInner
        isDesktop={isDesktop ?? false}
        preloadedContents={preloadedContents}
        shortcutSlugs={shortcutSlugs}
      >
        {children}
      </WindowManagerInner>
    </PreloaderProvider>
  )
}

// Inner component sits inside PreloaderProvider so it can call usePreloader()
function WindowManagerInner({
  children,
  isDesktop,
  preloadedContents,
  shortcutSlugs,
}: {
  children: ReactNode
  isDesktop: boolean
  preloadedContents: Record<string, WindowContentResult>
  shortcutSlugs: string[]
}) {
  const manager = useWindowManager()
  const { reportReady } = usePreloader()
  const [closedSlugs, setClosedSlugs] = useState<Set<string>>(new Set())

  // A pre-loaded window is visible when it is open (in manager.windows),
  // not minimized, and not the primary route window.
  // pendingMinimize is intentionally NOT checked — the collapse animation
  // needs the window visible while it's playing.
  function isWindowVisible(slug: string): boolean {
    if (slug === manager.primarySlug) return false
    const win = manager.windows.find((w) => w.slug === slug)
    if (!win) return false
    if (win.minimized) return false
    return true
  }

  return (
    <WindowManagerContextProvider manager={manager}>
      <PagePreloader />
      {children}

      {/* Pre-rendered shortcut windows — always mounted, CSS-hidden when not open */}
      {isDesktop && shortcutSlugs.map((slug) => {
        const win = manager.windows.find((w) => w.slug === slug)
        const visible = isWindowVisible(slug)

        return (
          <div
            key={slug}
            style={!visible ? { display: 'none' } : undefined}
          >
            <AdditionalWindow
              slug={slug}
              zIndex={win?.zIndex ?? BASE_Z}
              cascadeIndex={win?.cascadeIndex ?? 0}
              pendingMinimize={win?.pendingMinimize ?? false}
              preloadedData={preloadedContents[slug] ?? null}
              isVisible={visible}
              onReady={reportReady}
              onClose={() => {
                setClosedSlugs((p) => new Set([...p, slug]))
                manager.close(slug)
              }}
              onFocus={() => manager.focus(slug)}
              onMinimize={() => manager.actualMinimize(slug)}
            />
          </div>
        )
      })}

      {/* On-demand windows — traditional mount/unmount, not in shortcut list */}
      {isDesktop && manager.windows
        .filter(
          (win) =>
            win.slug !== manager.primarySlug &&
            !win.minimized &&
            !shortcutSlugs.includes(win.slug),
        )
        .map((win) => (
          <AdditionalWindow
            key={win.slug}
            slug={win.slug}
            zIndex={win.zIndex}
            cascadeIndex={win.cascadeIndex}
            pendingMinimize={win.pendingMinimize}
            onClose={() => manager.close(win.slug)}
            onFocus={() => manager.focus(win.slug)}
            onMinimize={() => manager.actualMinimize(win.slug)}
          />
        ))}

      {isDesktop && <Taskbar />}
    </WindowManagerContextProvider>
  )
}
