'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useWindowManagerContext } from '@/components/window/manager-context'
import { isDesktopViewport } from '@/lib/breakpoints'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import {
  clearShortcutPositions,
  clampShortcutPosition,
  getDefaultShortcutPosition,
  getShortcutLayout,
  loadShortcutPositions,
  saveShortcutPosition,
  type ShortcutLayout,
  type ShortcutPositions,
} from '@/lib/shortcut-positions'
import { Shortcut } from './index'

interface ShortcutData {
  icon: string
  name: string
  href: string
  slug: string
  color: string
}

export function ShortcutGrid({ shortcuts }: { shortcuts: ShortcutData[] }) {
  const manager = useWindowManagerContext()
  const isDesktop = useIsDesktop()
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<ShortcutPositions>({})
  const [layout, setLayout] = useState<ShortcutLayout | null>(null)
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null)
  const draggedRef = useRef(false)

  useEffect(() => {
    setPositions(loadShortcutPositions())
  }, [])

  useEffect(() => {
    function onReset() {
      clearShortcutPositions()
      setPositions({})
    }
    window.addEventListener('dimmos:reset-shortcut-positions', onReset)
    return () => window.removeEventListener('dimmos:reset-shortcut-positions', onReset)
  }, [])

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface || !isDesktop) return

    function syncLayout() {
      const rect = surface!.getBoundingClientRect()
      setLayout(getShortcutLayout(rect.width, rect.height))
    }

    syncLayout()
    const observer = new ResizeObserver(syncLayout)
    observer.observe(surface)
    return () => observer.disconnect()
  }, [isDesktop])

  function openShortcut(e: React.MouseEvent<HTMLAnchorElement>, slug: string) {
    if (draggedRef.current) {
      e.preventDefault()
      draggedRef.current = false
      return
    }
    if (isDesktopViewport()) {
      e.preventDefault()
      manager.open(slug)
    }
  }

  function startShortcutDrag(
    e: React.PointerEvent<HTMLDivElement>,
    slug: string,
    index: number,
    currentLayout: ShortcutLayout,
  ) {
    if (e.button !== 0) return

    const target = e.currentTarget
    const startPointer = { x: e.clientX, y: e.clientY }
    const startPos = positions[slug] ?? getDefaultShortcutPosition(index, currentLayout)
    let latestPos = startPos
    let didMove = false

    target.setPointerCapture(e.pointerId)
    setDraggingSlug(slug)

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startPointer.x
      const dy = ev.clientY - startPointer.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didMove = true
      const next = clampShortcutPosition({ x: startPos.x + dx, y: startPos.y + dy }, currentLayout)
      latestPos = next
      setPositions((prev) => ({ ...prev, [slug]: next }))
    }

    function onUp() {
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      setDraggingSlug(null)

      if (didMove) {
        saveShortcutPosition(slug, latestPos)
        draggedRef.current = true
        window.setTimeout(() => {
          draggedRef.current = false
        }, 0)
      }
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
  }

  return (
    <div
      ref={surfaceRef}
      data-shortcut-surface=""
      className="grid h-full grid-cols-[repeat(var(--cols),var(--tile))] auto-rows-[calc(2*var(--tile))] lg:block"
    >
      {shortcuts.map((s, i) => (
        isDesktop && layout ? (
          <motion.div
            key={s.slug}
            data-draggable-shortcut=""
            data-shortcut-slug={s.slug}
            data-cursor-action="drag"
            className="absolute left-0 top-0 flex items-center justify-center"
            style={{
              width: layout.shortcutWidth,
              height: layout.shortcutHeight,
            }}
            animate={clampShortcutPosition(positions[s.slug] ?? getDefaultShortcutPosition(i, layout), layout)}
            transition={draggingSlug === s.slug ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
            whileTap={{ scale: 1.04, zIndex: 20 }}
            onPointerDown={(e) => startShortcutDrag(e, s.slug, i, layout)}
          >
            <Shortcut
              icon={s.icon}
              name={s.name}
              href={s.href}
              slug={s.slug}
              color={s.color}
              className="h-full w-full"
              onClick={(e) => openShortcut(e, s.slug)}
            />
          </motion.div>
        ) : (
          <Shortcut
            key={s.slug}
            icon={s.icon}
            name={s.name}
            href={s.href}
            slug={s.slug}
            color={s.color}
            onClick={(e) => openShortcut(e, s.slug)}
          />
        )
      ))}
    </div>
  )
}
