'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { isDesktopViewport } from '@/lib/breakpoints'
import { startPanelDrag } from '@/lib/window-drag'
import { WindowTitleBar } from '@/components/window/title-bar'
import { DrawerContext } from '@/components/drawer/context'

interface CookieBannerShellProps {
  children: ReactNode
}

export function CookieBannerShell({ children }: CookieBannerShellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mobileDragOffset, setMobileDragOffset] = useState(0)
  const [isMobileDragging, setIsMobileDragging] = useState(false)
  const mobileDragStartY = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  function close() { setIsOpen(false) }
  function open()  { setIsOpen(true) }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    function onContextClose() {
      close()
    }
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('dimmos:close-cookie-banner', onContextClose)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('dimmos:close-cookie-banner', onContextClose)
    }
  }, [])

  // ─── Mobile drag-to-dismiss ──────────────────────────────────────────────

  function handleMobilePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isDesktopViewport()) return
    mobileDragStartY.current = e.clientY
    setIsMobileDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handleMobilePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isMobileDragging) return
    setMobileDragOffset(Math.max(0, e.clientY - mobileDragStartY.current))
  }

  function handleMobilePointerUp() {
    if (!isMobileDragging) return
    const panelH = panelRef.current?.offsetHeight ?? 200
    if (mobileDragOffset > panelH * 0.4) close()
    setIsMobileDragging(false)
    setMobileDragOffset(0)
  }

  // ─── Desktop drag-to-move ────────────────────────────────────────────────

  function handleDesktopTitlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDesktopViewport()) return
    const panel = panelRef.current
    if (!panel) return
    startPanelDrag(e, panel, {
      defaultX: Math.max(20, window.innerWidth - 440),
      defaultY: 20,
      // position intentionally not persisted — the banner re-anchors top-right each visit
    })
  }

  // On mobile, override transform during drag
  const mobileDragStyle: React.CSSProperties | undefined = isMobileDragging
    ? { transform: `translateY(${mobileDragOffset}px)`, transition: 'none' }
    : undefined

  return (
    <DrawerContext.Provider value={{ close, open }}>
      {/* Mobile backdrop — lg:hidden keeps it off desktop.
          z-199 sits deliberately one below the panel's --win-z: 200 so the
          banner always paints above its own backdrop and above all windows. */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-199 bg-black/60 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cookie Notice"
        data-window-panel=""
        data-cookie-banner=""
        data-state={isOpen ? 'open' : 'closed'}
        className="backdrop-blur-lg"
        style={{
          '--win-z': '200',
          '--win-w': '420px',
          ...mobileDragStyle,
        } as React.CSSProperties}
      >
        {/* Desktop title bar — shared component (.win-titlebar is display:none on mobile).
            Banner-specific close label + bar class keep it out of window-scoped
            test/style selectors (.win-titlebar--bar, aria-label="Close"). */}
        <WindowTitleBar
          title="Cookie Notice"
          onClose={close}
          onPointerDown={handleDesktopTitlePointerDown}
          disableMinimize
          expandable={false}
          closeLabel="Close cookie notice"
          barClassName="win-titlebar--banner"
        />

        {/* Mobile drag handle — .win-draghandle is display:none on desktop */}
        <div
          className="win-draghandle justify-center pt-3 pb-6 cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={handleMobilePointerDown}
          onPointerMove={handleMobilePointerMove}
          onPointerUp={handleMobilePointerUp}
        >
          <div className="w-20 h-1 rounded-full bg-fg/20" />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {children}
        </div>
      </div>
    </DrawerContext.Provider>
  )
}
