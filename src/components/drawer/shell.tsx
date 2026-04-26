'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DrawerContext } from './context'

interface DrawerShellProps {
  children: ReactNode
  autoOpen?: boolean
  trigger?: ReactNode
}

export function DrawerShell({ children, autoOpen, trigger }: DrawerShellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  function close() {
    setIsOpen(false)
  }

  function open() {
    setIsOpen(true)
  }

  useEffect(() => {
    if (autoOpen) setIsOpen(true)
  }, [autoOpen])

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
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return
    setDragOffset(Math.max(0, e.clientY - dragStartY.current))
  }

  function handlePointerUp() {
    if (!isDragging) return
    const panelHeight = panelRef.current?.offsetHeight ?? 200
    if (dragOffset > panelHeight * 0.4) close()
    setIsDragging(false)
    setDragOffset(0)
  }

  const panelStyle =
    isDragging ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined

  return (
    <DrawerContext.Provider value={{ close, open }}>
      {trigger}

      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-bg will-change-transform border-t-2 border-fg/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={panelStyle}
      >
        <div
          className="flex justify-center pt-3 pb-6 cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="w-20 h-1 rounded-full bg-fg/20" />
        </div>

        {children}
      </div>
    </DrawerContext.Provider>
  )
}
