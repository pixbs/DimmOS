'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { ResizeHandles } from './ResizeHandles'
import { WindowTitleBar } from './title-bar'
import { useKeyboardInset } from '@/hooks/useKeyboardInset'
import { startPanelDrag } from '@/lib/window-drag'
import { loadSavedPosition, mergePositionToStorage, parsePx, type SavedPosition } from '@/lib/window-positions'
import type { WindowBehaviorConfig } from '@/utilities/windowBehavior'

const CASCADE_STEP = 32
const DEFAULT_BEHAVIOR: Pick<WindowBehaviorConfig, 'collapsible' | 'expandable' | 'resizable'> = {
  collapsible: true,
  expandable: false,
  resizable: true,
}

type WindowChromeBehavior = Pick<WindowBehaviorConfig, 'collapsible' | 'expandable' | 'resizable'>

type DefaultPosition = {
  x: number
  y: number
  w?: number
  h?: number
}

interface ManagedWindowShellProps {
  windowId: string
  secondaryWindowId?: string
  title: string
  zIndex: number
  cascadeIndex: number
  pendingMinimize: boolean
  storageKey: string
  children: ReactNode
  behavior?: Partial<WindowChromeBehavior>
  defaultPosition?: DefaultPosition
  animationTargetId?: string
  isPreloaded?: boolean
  isVisible?: boolean
  onReady?: () => void
  onClose: () => void
  onFocus: () => void
  onMinimize: () => void
  closeLabel?: string
  barClassName?: string
  className?: string
  attributes?: Record<`data-${string}`, string>
  style?: CSSProperties
}

function mergedBehavior(behavior?: Partial<WindowChromeBehavior>): WindowChromeBehavior {
  return { ...DEFAULT_BEHAVIOR, ...behavior }
}

export function ManagedWindowShell({
  windowId,
  secondaryWindowId = windowId,
  title,
  zIndex,
  cascadeIndex,
  pendingMinimize,
  storageKey,
  children,
  behavior: behaviorProp,
  defaultPosition,
  animationTargetId = windowId,
  isPreloaded = false,
  isVisible,
  onReady,
  onClose,
  onFocus,
  onMinimize,
  closeLabel = 'Close',
  barClassName,
  className = '',
  attributes,
  style,
}: ManagedWindowShellProps) {
  const behavior = mergedBehavior(behaviorProp)
  const defaults = defaultPosition ?? {
    x: 80 + cascadeIndex * CASCADE_STEP,
    y: 60 + cascadeIndex * CASCADE_STEP,
  }
  const getDefaultX = () => (
    defaults.x < 0 && typeof window !== 'undefined'
      ? Math.max(24, window.innerWidth - (defaults.w ?? 420) - 20)
      : defaults.x
  )
  const getDefaultY = () => defaults.y

  const [isExpanded, setIsExpanded] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const preExpandRef = useRef<SavedPosition | null>(null)
  const prevIsVisibleRef = useRef<boolean | undefined>(undefined)
  const controls = useAnimationControls()

  useKeyboardInset(panelRef)

  const onMinimizeRef = useRef(onMinimize)
  onMinimizeRef.current = onMinimize
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    onReadyRef.current?.()
  }, [])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const saved = loadSavedPosition(storageKey)
    panel.style.setProperty('--win-x', `${saved.x ?? getDefaultX()}px`)
    panel.style.setProperty('--win-y', `${saved.y ?? getDefaultY()}px`)

    const width = saved.w ?? defaults.w
    const height = saved.h ?? defaults.h
    if (width !== undefined) panel.style.setProperty('--win-w', `${width}px`)
    if (height !== undefined) panel.style.setProperty('--win-h', `${height}px`)
  }, [defaults.h, defaults.w, defaults.x, defaults.y, storageKey])

  useLayoutEffect(() => {
    if (!isPreloaded) {
      runOpenAnimation()
      return
    }

    const wasVisible = prevIsVisibleRef.current
    prevIsVisibleRef.current = isVisible

    if (isVisible && wasVisible !== true) {
      runOpenAnimation()
    } else if (!isVisible && wasVisible !== undefined) {
      controls.set({ scale: 0.82, opacity: 0 })
    }
  }, [isVisible])

  useEffect(() => {
    if (!pendingMinimize) return
    runCollapseAnimation().then(() => onMinimizeRef.current())
  }, [animationTargetId, pendingMinimize])

  function runOpenAnimation() {
    const el = panelRef.current
    if (!el) return
    const btn = document.querySelector<HTMLElement>(`[data-window-id="${animationTargetId}"]`)
    if (btn) {
      const elRect = el.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()
      const startX = btnRect.left + btnRect.width / 2 - (elRect.left + elRect.width / 2)
      const startY = btnRect.top + btnRect.height / 2 - (elRect.top + elRect.height / 2)
      controls.set({ x: startX, y: startY, scale: 0.08, opacity: 0 })
      controls.start({ x: 0, y: 0, scale: 1, opacity: 1, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } })
      return
    }

    controls.set({ scale: 0.82, opacity: 0 })
    controls.start({ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 340, damping: 28, mass: 0.9 } })
  }

  function runCollapseAnimation() {
    const el = panelRef.current
    const btn = document.querySelector<HTMLElement>(`[data-window-id="${animationTargetId}"]`)

    if (!el || !btn) {
      return Promise.resolve()
    }

    const elRect = el.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const targetX = btnRect.left + btnRect.width / 2 - (elRect.left + elRect.width / 2)
    const targetY = btnRect.top + btnRect.height / 2 - (elRect.top + elRect.height / 2)

    return controls.start({
      x: targetX,
      y: targetY,
      scale: 0.08,
      opacity: 0,
      transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
    })
  }

  async function handleClose() {
    await controls.start({ scale: 0.82, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } })
    onCloseRef.current()
  }

  function handleMinimizeButton() {
    runCollapseAnimation().then(() => onMinimizeRef.current())
  }

  function expand() {
    const panel = panelRef.current
    if (!panel) return
    const headerH = document.querySelector('header')?.offsetHeight ?? 40
    if (!isExpanded) {
      preExpandRef.current = {
        x: parsePx(panel, '--win-x', getDefaultX()),
        y: parsePx(panel, '--win-y', getDefaultY()),
        w: panel.offsetWidth,
        h: panel.offsetHeight,
      }
      panel.style.setProperty('--win-x', '0px')
      panel.style.setProperty('--win-y', '0px')
      panel.style.setProperty('--win-w', `${window.innerWidth}px`)
      panel.style.setProperty('--win-h', `${window.innerHeight - headerH}px`)
    } else {
      const prev = preExpandRef.current
      if (prev) {
        panel.style.setProperty('--win-x', `${prev.x ?? getDefaultX()}px`)
        panel.style.setProperty('--win-y', `${prev.y ?? getDefaultY()}px`)
        if (prev.w !== undefined) panel.style.setProperty('--win-w', `${prev.w}px`)
        else panel.style.removeProperty('--win-w')
        if (prev.h !== undefined) panel.style.setProperty('--win-h', `${prev.h}px`)
        else panel.style.removeProperty('--win-h')
      } else {
        panel.style.removeProperty('--win-x')
        panel.style.removeProperty('--win-y')
        panel.style.removeProperty('--win-w')
        panel.style.removeProperty('--win-h')
      }
    }
    setIsExpanded((v) => !v)
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const panel = panelRef.current
    if (!panel) return
    if (window.matchMedia('(min-width: 1024px)').matches) {
      startPanelDrag(e, panel, {
        defaultX: getDefaultX(),
        defaultY: getDefaultY(),
        onDragEnd: (pos) => mergePositionToStorage(storageKey, pos),
      })
      return
    }

    e.preventDefault()
    const startY = e.clientY
    let mobileOffset = 0

    panel.setPointerCapture(e.pointerId)
    panel.setAttribute('data-dragging', '')

    function onMove(ev: globalThis.PointerEvent) {
      mobileOffset = Math.max(0, ev.clientY - startY)
      panel!.style.transform = `translateY(${mobileOffset}px)`
      panel!.style.transition = 'none'
    }

    function onUp() {
      panel!.removeEventListener('pointermove', onMove)
      panel!.removeEventListener('pointerup', onUp)
      panel!.removeAttribute('data-dragging')

      const willClose = mobileOffset > (panel!.offsetHeight || 400) * 0.25
      panel!.style.transform = ''
      panel!.style.transition = ''
      if (willClose) onCloseRef.current()
    }

    panel.addEventListener('pointermove', onMove)
    panel.addEventListener('pointerup', onUp)
  }

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-managed-window={windowId}
      data-secondary-window={secondaryWindowId}
      data-window-panel=""
      data-state="open"
      {...attributes}
      style={{ '--win-z': String(zIndex), ...style } as CSSProperties}
      onPointerDown={onFocus}
      className={`w-full backdrop-blur-lg ${className}`}
      animate={controls}
    >
      <WindowTitleBar
        title={title}
        onClose={handleClose}
        onMinimize={handleMinimizeButton}
        onExpand={expand}
        onPointerDown={handlePointerDown}
        disableMinimize={!behavior.collapsible}
        expandable={behavior.expandable}
        expanded={isExpanded}
        closeLabel={closeLabel}
        barClassName={barClassName}
      />

      <div
        className="win-draghandle justify-center pt-3 pb-6 cursor-grab active:cursor-grabbing touch-none select-none"
        onPointerDown={handlePointerDown}
      >
        <div className="w-20 h-1 rounded-full bg-fg/20" />
      </div>

      {children}

      {behavior.resizable && !isExpanded && (
        <ResizeHandles
          panelRef={panelRef}
          onResizeEnd={(w, h) => mergePositionToStorage(storageKey, { w, h })}
        />
      )}
    </motion.div>
  )
}
