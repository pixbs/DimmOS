'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { DrawerContext } from './context'

export function PageDrawerShell({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  function close() {
    setIsOpen(false)
    setTimeout(() => router.push('/'), 300)
  }

  function open() {
    setIsOpen(true)
  }

  useEffect(() => {
    setIsOpen(true)
  }, [])

  // Sync body attribute for CSS — also clears any inline --drawer-open-pct left from drag
  useEffect(() => {
    document.body.dataset.pageDrawer = isOpen ? 'open' : 'closed'
    document.body.style.removeProperty('--drawer-open-pct')
  }, [isOpen])

  useEffect(() => {
    return () => {
      delete document.body.dataset.pageDrawer
    }
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragStartY.current = e.clientY
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    // Disable CSS transition so colors follow the finger directly
    document.body.dataset.pageDrawer = 'dragging'
    document.body.style.setProperty('--drawer-open-pct', '100%')
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return
    const delta = Math.max(0, e.clientY - dragStartY.current)
    setDragOffset(delta)
    const panelHeight = panelRef.current?.offsetHeight ?? 400
    const pct = Math.max(0, (1 - delta / panelHeight) * 100)
    document.body.style.setProperty('--drawer-open-pct', `${pct}%`)
  }

  function handlePointerUp() {
    if (!isDragging) return
    const panelHeight = panelRef.current?.offsetHeight ?? 400
    const willClose = dragOffset > panelHeight * 0.25
    // Re-enable transitions and set target state — CSS animates from current pct
    document.body.style.removeProperty('--drawer-open-pct')
    document.body.dataset.pageDrawer = willClose ? 'closed' : 'open'
    if (willClose) close()
    setIsDragging(false)
    setDragOffset(0)
  }

  return (
    <DrawerContext.Provider value={{ close, open }}>
      <div
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 z-20 pointer-events-none bg-bgs flex flex-col"
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
        className={`fixed inset-x-0 bottom-0 z-30 bg-bg border-t-2 border-fg/10 rounded-t-2xl will-change-transform flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          top: 'var(--header-height)',
          ...(isDragging ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : {}),
        }}
      >
        <div
          className="flex justify-center pt-3 pb-6 cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="w-20 h-1 rounded-full bg-fg/20" />
        </div>

        <div className="flex-1 overflow-auto min-h-0">{children}</div>
      </div>
    </DrawerContext.Provider>
  )
}
