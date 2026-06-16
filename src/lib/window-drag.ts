import { parsePx, clamp } from './window-positions'

export interface PanelDragOptions {
  /** Fallback --win-x when the panel has no inline position yet */
  defaultX: number
  /** Fallback --win-y when the panel has no inline position yet */
  defaultY: number
  /** Called with the final position on pointer-up; omit to skip persistence */
  onDragEnd?: (pos: { x: number; y: number }) => void
}

/**
 * Desktop panel drag-to-move: pointer capture on the panel, data-dragging
 * attribute (suppresses CSS transitions), viewport-clamped --win-x/--win-y
 * updates. Used by floating windows, the page drawer (desktop mode), and the
 * cookie banner. Mobile sheet-dismiss drags are surface-specific and live in
 * their own components.
 */
export function startPanelDrag(
  e: React.PointerEvent,
  panel: HTMLElement,
  { defaultX, defaultY, onDragEnd }: PanelDragOptions,
): void {
  e.preventDefault()

  const startX = e.clientX
  const startY = e.clientY
  const startWinX = parsePx(panel, '--win-x', defaultX)
  const startWinY = parsePx(panel, '--win-y', defaultY)

  panel.setPointerCapture(e.pointerId)
  panel.setAttribute('data-dragging', '')

  function onMove(ev: PointerEvent) {
    const maxX = window.innerWidth - (panel.offsetWidth || 400)
    const maxY = window.innerHeight - (panel.offsetHeight || 300)
    panel.style.setProperty('--win-x', `${clamp(startWinX + ev.clientX - startX, 0, Math.max(0, maxX))}px`)
    panel.style.setProperty('--win-y', `${clamp(startWinY + ev.clientY - startY, 0, Math.max(0, maxY))}px`)
  }

  function onUp() {
    panel.removeEventListener('pointermove', onMove)
    panel.removeEventListener('pointerup', onUp)
    panel.removeAttribute('data-dragging')
    onDragEnd?.({
      x: parsePx(panel, '--win-x', defaultX),
      y: parsePx(panel, '--win-y', defaultY),
    })
  }

  panel.addEventListener('pointermove', onMove)
  panel.addEventListener('pointerup', onUp)
}
