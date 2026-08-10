'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { computeGrid, drawGrid } from './grid'

// ── Proximity ────────────────────────────────────────────────────────────────
const INFLUENCE_TILES      = 4.2   // radius in tile widths
const RADIUS_PRESSED_SCALE = 1.5   // ×50 % while mouse button held

// ── Idle animation ───────────────────────────────────────────────────────────
const IDLE_SWEEP     = 12    // seconds per UL → LR diagonal pass (then wraps)
const IDLE_WAVE_FREQ = 0.5   // perpendicular sine oscillations per second
const IDLE_WAVE_AMP  = 0.2   // amplitude as fraction of the shorter screen dimension

// ─────────────────────────────────────────────────────────────────────────────

export function DesktopWallpaper() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  // Phase-1: mount the portal into <body> so the canvas sits at the absolute
  // root of the compositing tree.  backdrop-filter on the taskbar reliably
  // captures compositing layers that are direct children of <body>; if the
  // canvas stays inside <main> it ends up in a different subtree and many
  // browsers silently skip it when building the blur backdrop snapshot.
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Phase-2: canvas setup — runs once the portal has rendered the <canvas>
  // into the DOM and canvasRef.current is guaranteed non-null.
  useEffect(() => {
    if (!mounted) return

    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const ctxObj = canvasEl.getContext('2d')
    if (!ctxObj) return
    // Alias to non-nullable types so all inner closures see correct types.
    const canvas: HTMLCanvasElement     = canvasEl
    const ctx: CanvasRenderingContext2D = ctxObj

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const hasPointer = window.matchMedia('(hover: hover)').matches

    let mouseX = 0, mouseY = 0
    let isMouseInWindow = false
    let isMouseDown  = false
    let radiusScale  = 1.0
    let idleElapsed  = 0
    let headerH      = 0
    let cols = 6, tileSize = 1, rows = 1
    let proximities  = new Float32Array(0)
    let rafId = 0, prevTimestamp = 0, firstDraw = true

    function resize() {
      headerH = document.querySelector('header')?.getBoundingClientRect().height ?? 0
      const w = window.innerWidth
      const h = window.innerHeight - headerH

      canvas.width        = Math.round(w * dpr)
      canvas.height       = Math.round(h * dpr)
      canvas.style.width  = w + 'px'
      canvas.style.height = h + 'px'
      canvas.style.top    = headerH + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const g     = computeGrid(w, h)
      cols        = g.cols
      tileSize    = g.tileSize
      rows        = g.rows
      proximities = new Float32Array(rows * cols)
    }

    function draw(timestamp: number) {
      const dt = prevTimestamp === 0 ? 0.016 : (timestamp - prevTimestamp) / 1000
      prevTimestamp = timestamp

      const w = canvas.width  / dpr
      const h = canvas.height / dpr

      let ex: number, ey: number

      if (!hasPointer || !isMouseInWindow) {
        idleElapsed += dt

        const margin   = tileSize * INFLUENCE_TILES
        const progress = (idleElapsed / IDLE_SWEEP) % 1
        const mainX    = -margin + progress * (w + margin * 2)
        const mainY    = progress * h

        const diagLen = Math.hypot(w, h)
        const amp     = Math.min(w, h) * IDLE_WAVE_AMP
        const wave    = Math.sin(idleElapsed * IDLE_WAVE_FREQ * Math.PI * 2) * amp

        ex = mainX + wave * (-h / diagLen)
        ey = mainY + wave * ( w / diagLen)
      } else {
        ex = mouseX
        ey = mouseY
      }

      const targetScale = isMouseDown ? RADIUS_PRESSED_SCALE : 1.0
      radiusScale += (targetScale - radiusScale) * Math.min(1, dt * 8)

      const influence = tileSize * INFLUENCE_TILES * radiusScale

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = (c + 0.5) * tileSize
          const cy = (r + 0.5) * tileSize
          const d  = Math.hypot(cx - ex, cy - ey)
          const t  = Math.max(0, 1 - d / influence)
          proximities[r * cols + c] = t * t * t
        }
      }

      drawGrid(ctx, { cols, rows, tileSize, proximities, width: w, height: h })

      if (firstDraw) {
        canvas.style.opacity = '1'
        firstDraw = false
      }

      rafId = requestAnimationFrame(draw)
    }

    const onMove      = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY - headerH; isMouseInWindow = true }
    const onLeave     = () => { isMouseInWindow = false; idleElapsed = 0 }
    const onEnter     = () => { isMouseInWindow = true }
    const onMouseDown = () => { isMouseDown = true }
    const onMouseUp   = () => { isMouseDown = false }

    const ro = new ResizeObserver(resize)
    ro.observe(document.documentElement)

    if (hasPointer) {
      document.addEventListener('mousemove',  onMove,      { passive: true })
      document.addEventListener('mouseleave', onLeave)
      document.addEventListener('mouseenter', onEnter)
      document.addEventListener('mousedown',  onMouseDown)
      document.addEventListener('mouseup',    onMouseUp)
    }

    resize()
    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove',  onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.removeEventListener('mousedown',  onMouseDown)
      document.removeEventListener('mouseup',    onMouseUp)
      ro.disconnect()
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity 400ms ease',
      }}
    />,
    document.body,
  )
}
