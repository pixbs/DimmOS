'use client'

import { useState, type ReactNode } from 'react'
import { useWindowManager } from '@/hooks/useWindowManager'
import { useIsDesktop } from '@/hooks/useIsDesktop'
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
  const isDesktop = useIsDesktop()

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
  const [, setClosedSlugs] = useState<Set<string>>(new Set())

  function isWindowVisible(rootSlug: string): boolean {
    if (rootSlug === manager.primarySlug) return false
    const win = manager.windows.find((w) => w.rootSlug === rootSlug)
    if (!win) return false
    if (win.minimized) return false
    return true
  }

  return (
    <WindowManagerContextProvider manager={manager}>
      <PagePreloader />
      {children}

      {/* Pre-rendered shortcut windows — always mounted, CSS-hidden when not open */}
      {isDesktop && shortcutSlugs.map((rootSlug) => {
        const win = manager.windows.find((w) => w.rootSlug === rootSlug)
        const visible = isWindowVisible(rootSlug)

        return (
          <div
            key={rootSlug}
            style={!visible ? { display: 'none' } : undefined}
          >
            <AdditionalWindow
              rootSlug={rootSlug}
              slug={win?.slug ?? rootSlug}
              canGoBack={(win?.historyIndex ?? 0) > 0}
              canGoForward={(win?.historyIndex ?? 0) < (win?.historyStack.length ?? 1) - 1}
              onNavigate={(s) => manager.navigateInWindow(rootSlug, s)}
              onBack={() => manager.backInWindow(rootSlug)}
              onForward={() => manager.forwardInWindow(rootSlug)}
              zIndex={win?.zIndex ?? BASE_Z}
              cascadeIndex={win?.cascadeIndex ?? 0}
              pendingMinimize={win?.pendingMinimize ?? false}
              preloadedData={preloadedContents[rootSlug] ?? null}
              isVisible={visible}
              onReady={reportReady}
              onClose={() => {
                setClosedSlugs((p) => new Set([...p, rootSlug]))
                manager.close(rootSlug)
              }}
              onFocus={() => manager.focus(rootSlug)}
              onMinimize={() => manager.actualMinimize(rootSlug)}
            />
          </div>
        )
      })}

      {/* On-demand windows — traditional mount/unmount, not in shortcut list */}
      {isDesktop && manager.windows
        .filter(
          (win) =>
            win.rootSlug !== manager.primarySlug &&
            !win.minimized &&
            !shortcutSlugs.includes(win.rootSlug),
        )
        .map((win) => (
          <AdditionalWindow
            key={win.rootSlug}
            rootSlug={win.rootSlug}
            slug={win.slug}
            canGoBack={win.historyIndex > 0}
            canGoForward={win.historyIndex < win.historyStack.length - 1}
            onNavigate={(s) => manager.navigateInWindow(win.rootSlug, s)}
            onBack={() => manager.backInWindow(win.rootSlug)}
            onForward={() => manager.forwardInWindow(win.rootSlug)}
            zIndex={win.zIndex}
            cascadeIndex={win.cascadeIndex}
            pendingMinimize={win.pendingMinimize}
            onClose={() => manager.close(win.rootSlug)}
            onFocus={() => manager.focus(win.rootSlug)}
            onMinimize={() => manager.actualMinimize(win.rootSlug)}
          />
        ))}

      {isDesktop && <Taskbar />}
    </WindowManagerContextProvider>
  )
}
