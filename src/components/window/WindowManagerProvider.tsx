'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useWindowManager } from '@/hooks/useWindowManager'
import { WindowManagerContextProvider } from './manager-context'
import { AdditionalWindow } from './AdditionalWindow'
import { Taskbar } from '@/components/taskbar'

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const manager = useWindowManager()
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    function check() {
      setIsDesktop(window.innerWidth >= 1024)
    }
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <WindowManagerContextProvider manager={manager}>
      {children}
      {isDesktop && manager.windows
        .filter((win) => win.slug !== manager.primarySlug && !win.minimized)
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
