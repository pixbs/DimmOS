'use client'

import { useEffect, useRef } from 'react'
import { WindowScaffold } from '@/components/window/window-scaffold'
import { WindowTitleBar } from '@/components/window/title-bar'
import { startPanelDrag } from '@/lib/window-drag'
import { loadSavedPosition, mergePositionToStorage } from '@/lib/window-positions'
import { useDisplayOptions } from './context'

const STORAGE_KEY = 'system:display-options'

export function DisplayOptionsWindow() {
  const { cursorMode, setCursorMode, isDisplayOptionsOpen, closeDisplayOptions } = useDisplayOptions()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDisplayOptionsOpen) return
    const panel = panelRef.current
    if (!panel) return
    const saved = loadSavedPosition(STORAGE_KEY)
    panel.style.setProperty('--win-x', `${saved.x ?? Math.max(24, window.innerWidth - 420)}px`)
    panel.style.setProperty('--win-y', `${saved.y ?? 56}px`)
    if (saved.w !== undefined) panel.style.setProperty('--win-w', `${saved.w}px`)
    if (saved.h !== undefined) panel.style.setProperty('--win-h', `${saved.h}px`)
  }, [isDisplayOptionsOpen])

  useEffect(() => {
    if (!isDisplayOptionsOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDisplayOptions()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeDisplayOptions, isDisplayOptionsOpen])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const panel = panelRef.current
    if (!panel) return
    startPanelDrag(e, panel, {
      defaultX: Math.max(24, window.innerWidth - 420),
      defaultY: 56,
      onDragEnd: (pos) => mergePositionToStorage(STORAGE_KEY, pos),
    })
  }

  if (!isDisplayOptionsOpen) return null

  const useWebsiteCursor = cursorMode === 'website'

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Display Options"
      data-window-panel=""
      data-display-options-window=""
      data-state="open"
      className="backdrop-blur-lg"
      style={{
        '--win-z': '190',
        '--win-w': '380px',
        '--win-h': '220px',
      } as React.CSSProperties}
    >
      <WindowTitleBar
        title="Display Options"
        onClose={closeDisplayOptions}
        onPointerDown={handlePointerDown}
        disableMinimize
        expandable={false}
        closeLabel="Close display options"
        barClassName="win-titlebar--system"
      />

      <WindowScaffold>
        <div className="flex h-full flex-col justify-center gap-4 px-5">
          <div className="flex items-center justify-between gap-4 rounded-lg bg-white/5 px-4 py-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-fg">Website cursor</span>
              <span className="text-xs text-fg/45">{useWebsiteCursor ? 'Enabled' : 'System cursor'}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="Use website cursor"
              aria-checked={useWebsiteCursor}
              onClick={() => setCursorMode(useWebsiteCursor ? 'system' : 'website')}
              className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
                useWebsiteCursor ? 'bg-brand' : 'bg-fg/25'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-fg shadow-sm transition-transform duration-200 ${
                  useWebsiteCursor ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </WindowScaffold>
    </div>
  )
}
