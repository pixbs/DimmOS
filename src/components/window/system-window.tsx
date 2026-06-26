'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ManagedWindowShell } from './managed-window-shell'
import { systemWindowRegistry } from './system-window-registry'
import { useCookieConsent } from '@/components/cookie-banner/context'
import type { ManagedWindow, SystemWindowKey } from '@/lib/window-state'
import type { SystemWindowData } from './system-window-types'

interface SystemWindowProps {
  win: ManagedWindow
  data: SystemWindowData
  onClose: () => void
  onFocus: () => void
  onMinimize: () => void
  openSystem: (key: SystemWindowKey) => void
}

export function SystemWindow({ win, data, onClose, onFocus, onMinimize, openSystem }: SystemWindowProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { needsBanner } = useCookieConsent()

  if (win.kind !== 'system' || !win.systemKey) return null

  const entry = systemWindowRegistry[win.systemKey]
  const Renderer = entry.render

  function closeWindow() {
    onClose()
    if (win.systemKey === 'cookie-preferences' && pathname === '/cookie-preferences') {
      router.push('/')
    }
  }

  function handleTitleClose() {
    closeWindow()
    if (win.systemKey === 'cookie-preferences' && needsBanner) {
      openSystem('cookie-notice')
    }
  }

  return (
    <ManagedWindowShell
      windowId={win.id}
      title={entry.title}
      zIndex={Math.max(win.zIndex, entry.zIndexPriority)}
      cascadeIndex={win.cascadeIndex}
      pendingMinimize={win.pendingMinimize}
      storageKey={win.id}
      behavior={entry.behavior}
      defaultPosition={entry.defaultPosition}
      animationTargetId={win.id}
      onClose={handleTitleClose}
      onFocus={onFocus}
      onMinimize={onMinimize}
      attributes={entry.attributes}
      style={entry.style}
      barClassName="win-titlebar--system"
    >
      <Renderer data={data} close={closeWindow} openSystem={openSystem} />
    </ManagedWindowShell>
  )
}
