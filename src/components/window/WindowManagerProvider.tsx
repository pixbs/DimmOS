'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useWindowManager } from '@/hooks/useWindowManager'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { parseOpenWindows } from '@/lib/window-state'
import { useWindowManagerContext, WindowManagerContextProvider } from './manager-context'
import { AdditionalWindow } from './AdditionalWindow'
import { SystemWindow } from './system-window'
import { Taskbar } from '@/components/taskbar'
import { PreloaderProvider, usePreloader } from '@/components/preloader/preloader-context'
import { PagePreloader } from '@/components/preloader/PagePreloader'
import type { WindowContentResult } from '@/lib/windowContent'
import type { SystemWindowData } from './system-window-types'
import { useCookieConsent } from '@/components/cookie-banner/context'

interface WindowManagerProviderProps {
  children: ReactNode
  preloadedContents?: Record<string, WindowContentResult>
  shortcutSlugs?: string[]
  startupWindows?: StartupWindowEntry[]
  systemWindowData: SystemWindowData
}

export type StartupWindowEntry = {
  slug: string
  viewports: ('desktop' | 'mobile')[]
}

const BASE_Z = 50
const STARTUP_SESSION_KEY = 'managed-startup-opened'

export function WindowManagerProvider({
  children,
  preloadedContents = {},
  shortcutSlugs = [],
  startupWindows = [],
  systemWindowData,
}: WindowManagerProviderProps) {
  const isDesktop = useIsDesktop()
  const preloadedSlugs = useMemo(
    () => [...new Set([...shortcutSlugs, ...startupWindows.map((entry) => entry.slug)])],
    [shortcutSlugs, startupWindows],
  )

  const total = isDesktop === null ? null : isDesktop ? preloadedSlugs.length : 0

  return (
    <PreloaderProvider total={total}>
      <WindowManagerInner
        isDesktop={isDesktop ?? false}
        isDesktopResolved={isDesktop !== null}
        preloadedContents={preloadedContents}
        preloadedSlugs={preloadedSlugs}
        startupWindows={startupWindows}
        systemWindowData={systemWindowData}
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
  isDesktopResolved,
  preloadedContents,
  preloadedSlugs,
  startupWindows,
  systemWindowData,
}: {
  children: ReactNode
  isDesktop: boolean
  isDesktopResolved: boolean
  preloadedContents: Record<string, WindowContentResult>
  preloadedSlugs: string[]
  startupWindows: StartupWindowEntry[]
  systemWindowData: SystemWindowData
}) {
  const manager = useWindowManager()
  const pathname = usePathname()
  const { reportReady } = usePreloader()
  const [, setClosedSlugs] = useState<Set<string>>(new Set())

  function isWindowVisible(rootSlug: string): boolean {
    if (rootSlug === manager.primarySlug) return false
    const win = manager.windows.find((w) => w.rootSlug === rootSlug)
    if (!win) return false
    if (win.minimized) return false
    return true
  }

  const managedMobileWindow = isDesktop
    ? null
    : manager.windows
      .filter((win) => win.rootSlug !== manager.primarySlug && !win.minimized)
      .reduce<null | typeof manager.windows[number]>((top, win) => (
        !top || win.zIndex > top.zIndex ? win : top
      ), null)

  return (
    <WindowManagerContextProvider manager={manager}>
      <WindowLifecycleControllers
        isDesktop={isDesktop}
        isDesktopResolved={isDesktopResolved}
        pathname={pathname}
        startupWindows={startupWindows}
      />
      <PagePreloader />
      {children}

      {/* Pre-rendered shortcut windows — always mounted, CSS-hidden when not open */}
      {isDesktop && preloadedSlugs.map((rootSlug) => {
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
            win.kind === 'content' &&
            win.rootSlug !== manager.primarySlug &&
            !win.minimized &&
            !preloadedSlugs.includes(win.rootSlug),
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

      {isDesktop && manager.windows
        .filter((win) => win.kind === 'system' && !win.minimized)
        .map((win) => (
          <SystemWindow
            key={win.id}
            win={win}
            data={systemWindowData}
            openSystem={manager.openSystem}
            onClose={() => manager.close(win.id)}
            onFocus={() => manager.focus(win.id)}
            onMinimize={() => manager.actualMinimize(win.id)}
          />
        ))}

      {!isDesktop && managedMobileWindow?.kind === 'content' && (
        <AdditionalWindow
          key={managedMobileWindow.rootSlug}
          rootSlug={managedMobileWindow.rootSlug}
          slug={managedMobileWindow.slug}
          canGoBack={managedMobileWindow.historyIndex > 0}
          canGoForward={managedMobileWindow.historyIndex < managedMobileWindow.historyStack.length - 1}
          onNavigate={(s) => manager.navigateInWindow(managedMobileWindow.rootSlug, s)}
          onBack={() => manager.backInWindow(managedMobileWindow.rootSlug)}
          onForward={() => manager.forwardInWindow(managedMobileWindow.rootSlug)}
          zIndex={managedMobileWindow.zIndex}
          cascadeIndex={managedMobileWindow.cascadeIndex}
          pendingMinimize={managedMobileWindow.pendingMinimize}
          preloadedData={preloadedContents[managedMobileWindow.rootSlug]}
          onClose={() => manager.close(managedMobileWindow.rootSlug)}
          onFocus={() => manager.focus(managedMobileWindow.rootSlug)}
          onMinimize={() => manager.actualMinimize(managedMobileWindow.rootSlug)}
        />
      )}

      {!isDesktop && managedMobileWindow?.kind === 'system' && (
        <SystemWindow
          key={managedMobileWindow.id}
          win={managedMobileWindow}
          data={systemWindowData}
          openSystem={manager.openSystem}
          onClose={() => manager.close(managedMobileWindow.id)}
          onFocus={() => manager.focus(managedMobileWindow.id)}
          onMinimize={() => manager.actualMinimize(managedMobileWindow.id)}
        />
      )}

      {isDesktop && <Taskbar />}
    </WindowManagerContextProvider>
  )
}

function WindowLifecycleControllers({
  isDesktop,
  isDesktopResolved,
  pathname,
  startupWindows,
}: {
  isDesktop: boolean
  isDesktopResolved: boolean
  pathname: string
  startupWindows: StartupWindowEntry[]
}) {
  const { needsBanner, isLoading } = useCookieConsent()
  const { openSystem, close, openStartupContent } = useWindowManagerContext()
  const openedQueryRef = useRef<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (needsBanner && pathname !== '/cookie-preferences') {
      openSystem('cookie-notice')
    } else {
      close('system:cookie-notice')
    }
  }, [close, isLoading, needsBanner, openSystem, pathname])

  useEffect(() => {
    if (pathname === '/cookie-preferences') {
      openSystem('cookie-preferences')
    }
  }, [openSystem, pathname])

  useEffect(() => {
    function onOpenDisplayOptions() {
      openSystem('display-options')
    }
    window.addEventListener('dimmos:open-display-options', onOpenDisplayOptions)
    document.documentElement.dataset.displayOptionsReady = 'true'
    return () => {
      window.removeEventListener('dimmos:open-display-options', onOpenDisplayOptions)
      delete document.documentElement.dataset.displayOptionsReady
    }
  }, [openSystem])

  useEffect(() => {
    if (!isDesktopResolved || pathname !== '/') return
    const params = new URLSearchParams(window.location.search)
    const rawOpenParam = params.get('open') ?? ''
    if (!rawOpenParam) {
      openedQueryRef.current = null
      return
    }
    if (openedQueryRef.current === rawOpenParam) return
    openedQueryRef.current = rawOpenParam

    const slugs = parseOpenWindows(params)
    if (slugs.length === 0) return
    openStartupContent(slugs)
  }, [isDesktopResolved, openStartupContent, pathname])

  useEffect(() => {
    if (!isDesktopResolved || pathname !== '/' || startupWindows.length === 0) return
    const viewport = isDesktop ? 'desktop' : 'mobile'
    const slugs = startupWindows
      .filter((entry) => entry.viewports.includes(viewport))
      .map((entry) => entry.slug)

    if (slugs.length === 0) return

    const sessionKey = `${STARTUP_SESSION_KEY}:${viewport}`
    if (window.sessionStorage.getItem(sessionKey) === 'true') return

    window.sessionStorage.setItem(sessionKey, 'true')
    openStartupContent(slugs)
  }, [isDesktop, isDesktopResolved, openStartupContent, pathname, startupWindows])

  return null
}
