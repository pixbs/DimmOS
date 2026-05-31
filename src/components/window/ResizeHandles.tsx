'use client'

import { type RefObject, useState, useEffect } from 'react'

const MIN_W = 320
const MIN_H = 200
const KEYBOARD_STEP = 16

type Edge = 'e' | 's' | 'se'

interface ResizeHandlesProps {
  panelRef: RefObject<HTMLDivElement | null>
  onResizeEnd?: (w: number, h: number) => void
}

/**
 * Accessible resize handles for desktop windows.
 *
 * Each handle uses role="separator" with aria-valuenow/min/max per WAI-ARIA 1.2
 * and keyboard arrow-key support. Pointer capture ensures drags don't escape.
 * Only visible on desktop (≥1024px) via CSS.
 */
export function ResizeHandles({ panelRef, onResizeEnd }: ResizeHandlesProps) {
  const [widthPct, setWidthPct] = useState(50)
  const [heightPct, setHeightPct] = useState(50)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    setWidthPct(Math.round((panel.offsetWidth / window.innerWidth) * 100))
    setHeightPct(Math.round((panel.offsetHeight / window.innerHeight) * 100))
  }, [panelRef])

  function handleResizeEnd(w: number, h: number) {
    setWidthPct(Math.round((w / window.innerWidth) * 100))
    setHeightPct(Math.round((h / window.innerHeight) * 100))
    onResizeEnd?.(w, h)
  }

  function startResize(edge: Edge, e: React.PointerEvent<HTMLDivElement>) {
    const panel = panelRef.current
    if (!panel) return
    e.preventDefault()
    e.stopPropagation() // don't bubble to the window drag handler

    const handle = e.currentTarget as HTMLDivElement
    handle.setPointerCapture(e.pointerId)
    panel.setAttribute('data-resizing', '') // suppress position/size transitions during drag

    const startX = e.clientX
    const startY = e.clientY
    const startW = panel.offsetWidth
    const startH = panel.offsetHeight
    const rect = panel.getBoundingClientRect()
    const maxW = window.innerWidth - rect.left
    const maxH = window.innerHeight - rect.top

    function onMove(ev: PointerEvent) {
      const dX = ev.clientX - startX
      const dY = ev.clientY - startY

      if (edge === 'e' || edge === 'se') {
        panel!.style.setProperty('--win-w', `${Math.min(maxW, Math.max(MIN_W, startW + dX))}px`)
      }
      if (edge === 's' || edge === 'se') {
        panel!.style.setProperty('--win-h', `${Math.min(maxH, Math.max(MIN_H, startH + dY))}px`)
      }
    }

    function onUp() {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      panel!.removeAttribute('data-resizing')
      handleResizeEnd(panel!.offsetWidth, panel!.offsetHeight)
    }

    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
  }

  function handleKeyDown(edge: Edge, e: React.KeyboardEvent<HTMLDivElement>) {
    const panel = panelRef.current
    if (!panel) return

    let dW = 0
    let dH = 0

    if ((edge === 'e' || edge === 'se') && e.key === 'ArrowRight') dW = KEYBOARD_STEP
    if ((edge === 'e' || edge === 'se') && e.key === 'ArrowLeft') dW = -KEYBOARD_STEP
    if ((edge === 's' || edge === 'se') && e.key === 'ArrowDown') dH = KEYBOARD_STEP
    if ((edge === 's' || edge === 'se') && e.key === 'ArrowUp') dH = -KEYBOARD_STEP

    if (!dW && !dH) return
    e.preventDefault()

    // Cancel any ongoing CSS width/height transition so offsetWidth/Height reads
    // the committed size, not an animated intermediate value.
    panel.setAttribute('data-resizing', '')

    const rect = panel.getBoundingClientRect()
    let newW: number | null = null
    let newH: number | null = null

    if (dW) {
      const maxW = window.innerWidth - rect.left
      newW = Math.min(maxW, Math.max(MIN_W, panel.offsetWidth + dW))
      panel.style.setProperty('--win-w', `${newW}px`)
    }
    if (dH) {
      const maxH = window.innerHeight - rect.top
      newH = Math.min(maxH, Math.max(MIN_H, panel.offsetHeight + dH))
      panel.style.setProperty('--win-h', `${newH}px`)
    }

    handleResizeEnd(newW ?? panel.offsetWidth, newH ?? panel.offsetHeight)
    requestAnimationFrame(() => panel.removeAttribute('data-resizing'))
  }

  return (
    <>
      {/* East (right) edge — resizes width */}
      <div
        className="win-resize-handle win-resize-handle--e"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize window width"
        aria-valuenow={widthPct}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onPointerDown={(e) => startResize('e', e)}
        onKeyDown={(e) => handleKeyDown('e', e)}
      />
      {/* South (bottom) edge — resizes height */}
      <div
        className="win-resize-handle win-resize-handle--s"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize window height"
        aria-valuenow={heightPct}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onPointerDown={(e) => startResize('s', e)}
        onKeyDown={(e) => handleKeyDown('s', e)}
      />
      {/* South-east corner — resizes both */}
      <div
        className="win-resize-handle win-resize-handle--se"
        role="separator"
        aria-label="Resize window"
        aria-valuenow={widthPct}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onPointerDown={(e) => startResize('se', e)}
        onKeyDown={(e) => handleKeyDown('se', e)}
      />
    </>
  )
}
