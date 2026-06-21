'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { EASE_OUT_QUAD } from '@/lib/easing'
import { useDisplayOptions } from '@/components/display-options'

type CursorAction =
  | 'idle'
  | 'action'
  | 'drag'
  | 'window'
  | 'internal-link'
  | 'external-link'
  | 'resize-horizontal'
  | 'resize-vertical'
  | 'resize-diagonal'

const ACTION_ICONS: Record<Exclude<CursorAction, 'idle'>, string> = {
  action: 'ri-cursor-line',
  drag: 'ri-drag-move-2-line',
  window: 'ri-window-line',
  'internal-link': 'ri-arrow-right-line',
  'external-link': 'ri-external-link-line',
  'resize-horizontal': 'ri-expand-width-line',
  'resize-vertical': 'ri-expand-height-line',
  'resize-diagonal': 'ri-expand-diagonal-line',
}

function getCursorAction(target: EventTarget | null): CursorAction {
  if (!(target instanceof Element)) return 'idle'

  const explicit = target.closest<HTMLElement>('[data-cursor-action]')
  const action = explicit?.dataset.cursorAction
  if (action && action in ACTION_ICONS) return action as CursorAction

  if (target.closest('.win-resize-handle--e')) return 'resize-horizontal'
  if (target.closest('.win-resize-handle--s')) return 'resize-vertical'
  if (target.closest('.win-resize-handle--se')) return 'resize-diagonal'
  if (target.closest('.win-titlebar, .win-draghandle')) return 'drag'

  const link = target.closest<HTMLAnchorElement>('a[href]')
  if (link) {
    const href = link.getAttribute('href') ?? ''
    if (href.startsWith('/') && !href.startsWith('//')) return 'window'
    return 'external-link'
  }

  if (
    target.closest(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [role="button"], [role="switch"]',
    )
  ) {
    return 'action'
  }

  return 'idle'
}

function canUseCustomCursor(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches
}

export function DesktopCursor() {
  const { cursorMode } = useDisplayOptions()
  const cursorRef = useRef<HTMLDivElement>(null)
  const actionRef = useRef<CursorAction>('idle')
  const [mounted, setMounted] = useState(false)
  const [isFinePointer, setIsFinePointer] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [action, setAction] = useState<CursorAction>('idle')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)')
    function sync() {
      setIsFinePointer(media.matches)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [mounted])

  useEffect(() => {
    if (!mounted || cursorMode !== 'website' || !isFinePointer) return

    function updateAction(nextAction: CursorAction) {
      if (actionRef.current === nextAction) return
      actionRef.current = nextAction
      setAction(nextAction)
    }

    function onPointerMove(e: PointerEvent) {
      const node = cursorRef.current
      if (node) {
        node.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
      }
      setIsVisible(true)
      updateAction(getCursorAction(e.target))
    }

    function onPointerLeave() {
      setIsVisible(false)
      updateAction('idle')
    }

    function onPointerDown() {
      setIsPressed(true)
    }

    function onPointerUp() {
      setIsPressed(false)
    }

    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    document.addEventListener('pointerup', onPointerUp, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)
    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [cursorMode, isFinePointer, mounted])

  if (!mounted || cursorMode !== 'website' || !isFinePointer) return null

  const hasAction = action !== 'idle'
  const icon = hasAction ? ACTION_ICONS[action] : ''

  return createPortal(
    <div
      ref={cursorRef}
      aria-hidden="true"
      data-dimm-custom-cursor=""
      data-cursor-kind={action}
      className="fixed left-0 top-0 z-[10050] pointer-events-none"
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
      <motion.div
        className="flex items-center justify-center rounded-full bg-fg text-bg mix-blend-difference"
        initial={false}
        animate={{
          height: hasAction ? 34 : 8,
          width: hasAction ? 34 : 8,
          opacity: isVisible ? 1 : 0,
          scale: isPressed ? 0.82 : 1,
        }}
        transition={{ duration: 0.18, ease: EASE_OUT_QUAD }}
      >
        {hasAction && <i className={`${icon} text-[17px] leading-none`} />}
      </motion.div>
    </div>,
    document.body,
  )
}

export { canUseCustomCursor }
