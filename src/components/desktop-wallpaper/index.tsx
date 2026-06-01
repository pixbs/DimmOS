'use client'

import { useEffect, useRef } from 'react'

// ── Colours ──────────────────────────────────────────────────────────────────
const BASE_BG   = '#070707'   // --color-bgs  brand reveal backdrop
const TILE_FILL = '#111111'   // --color-bg   CSS inner-shadow tile colour
const BRAND     = '#F22F57'   // --color-brand

// ── Border ───────────────────────────────────────────────────────────────────
// Adjacent tiles share every boundary so the stroke is drawn TWICE per line.
// Per-call alpha of 0.105 × 2 overlaps ≈ rgba(255,255,255,0.2) visual result,
// matching color-mix(in srgb, var(--color-fg) 20%, transparent) from the CSS.
const BORDER_COLOR = 'rgba(255,255,255,0.02)'
const BORDER_WIDTH = 1.5   // matches --border

// ── "+" intersection marks ───────────────────────────────────────────────────
// Drawn once per intersection — no doubling — so alpha is the direct CSS value.
const PLUS_COLOR    = 'rgba(255,255,255,0.1)'
const PLUS_WIDTH    = 1.5
const PLUS_ARM_FRAC = 0.08   // arm length = max(4 px, tileSize × this)

// ── Proximity ────────────────────────────────────────────────────────────────
const INFLUENCE_TILES = 5.2   // radius in tile widths

// ── Idle animation ───────────────────────────────────────────────────────────
const IDLE_SWEEP     = 12    // seconds per UL → LR diagonal pass (then wraps)
const IDLE_WAVE_FREQ = 0.5   // perpendicular sine oscillations per second
const IDLE_WAVE_AMP  = 0.2  // amplitude as fraction of the shorter screen dimension

// ─────────────────────────────────────────────────────────────────────────────

function getCols(w: number) {
  if (w >= 1280) return 20
  if (w >= 768)  return 12
  return 6
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  r = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y,     x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x,     y + h, r)
  ctx.arcTo(x,     y + h, x,     y,     r)
  ctx.arcTo(x,     y,     x + w, y,     r)
  ctx.closePath()
}

export function DesktopWallpaper() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // TypeScript can't carry control-flow narrowing across closure boundaries,
    // so we alias after the guards — the inferred type at the alias declaration
    // is already non-nullable, and all inner functions see the correct type.
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const ctxObj = canvasEl.getContext('2d')
    if (!ctxObj) return
    const canvas: HTMLCanvasElement     = canvasEl
    const ctx: CanvasRenderingContext2D = ctxObj

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const hasPointer = window.matchMedia('(hover: hover)').matches

    let mouseX = 0, mouseY = 0
    let isMouseInWindow = false
    let idleElapsed = 0
    let headerH = 0
    let cols = 6, tileSize = 1, rows = 1
    let proximities = new Float32Array(0)
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

      cols        = getCols(w)
      tileSize    = w / cols
      rows        = Math.ceil(h / tileSize) + 1
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

        // Main axis: linear progress UL → LR, wraps back to UL (no bounce).
        const margin   = tileSize * INFLUENCE_TILES
        const progress = (idleElapsed / IDLE_SWEEP) % 1
        const mainX    = -margin + progress * (w + margin * 2)
        const mainY    = progress * h

        // Perpendicular sine wave — cursor wiggles across the diagonal path.
        // Perpendicular to diagonal (w, h) is the direction (-h, w) normalised.
        const diagLen  = Math.hypot(w, h)
        const amp      = Math.min(w, h) * IDLE_WAVE_AMP
        const wave     = Math.sin(idleElapsed * IDLE_WAVE_FREQ * Math.PI * 2) * amp

        ex = mainX + wave * (-h / diagLen)
        ey = mainY + wave * ( w / diagLen)
      } else {
        ex = mouseX
        ey = mouseY
      }

      const influence = tileSize * INFLUENCE_TILES

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = (c + 0.5) * tileSize
          const cy = (r + 0.5) * tileSize
          const d  = Math.hypot(cx - ex, cy - ey)
          const t  = Math.max(0, 1 - d / influence)
          proximities[r * cols + c] = t * t * t
        }
      }

      // 1. Base fill
      ctx.fillStyle = BASE_BG
      ctx.fillRect(0, 0, w, h)

      // 2. Brand patches — full-tile square; rounded tile reveals brand at corners
      ctx.fillStyle = BRAND
      ctx.beginPath()
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (proximities[r * cols + c] < 0.01) continue
          ctx.rect(c * tileSize, r * tileSize, tileSize, tileSize)
        }
      }
      ctx.fill()

      // 3. Tile fill + border stroke
      ctx.beginPath()
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const rnd = proximities[r * cols + c]
          roundedRect(ctx, c * tileSize, r * tileSize, tileSize, tileSize, rnd * tileSize * 0.5)
        }
      }
      ctx.fillStyle   = TILE_FILL
      ctx.fill()
      ctx.strokeStyle = BORDER_COLOR
      ctx.lineWidth   = BORDER_WIDTH
      ctx.stroke()

      // 4. "+" intersection marks — arm shrinks as surrounding tiles round
      const ARM_MAX = Math.max(4, tileSize * PLUS_ARM_FRAC)
      ctx.strokeStyle = PLUS_COLOR
      ctx.lineWidth   = PLUS_WIDTH
      ctx.beginPath()
      for (let c = 1; c < cols; c++) {
        for (let r = 1; r < rows; r++) {
          const avgRnd = (
            proximities[(r - 1) * cols + (c - 1)] +
            proximities[(r - 1) * cols +  c     ] +
            proximities[ r      * cols + (c - 1)] +
            proximities[ r      * cols +  c     ]
          ) / 4

          const arm = ARM_MAX * (1 - avgRnd)
          if (arm < 0.5) continue

          const ix = c * tileSize
          const iy = r * tileSize
          ctx.moveTo(ix - arm, iy)
          ctx.lineTo(ix + arm, iy)
          ctx.moveTo(ix, iy - arm)
          ctx.lineTo(ix, iy + arm)
        }
      }
      ctx.stroke()

      if (firstDraw) {
        canvas.style.opacity = '1'
        firstDraw = false
      }

      rafId = requestAnimationFrame(draw)
    }

    const onMove  = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY - headerH
      isMouseInWindow = true
    }
    const onLeave = () => { isMouseInWindow = false; idleElapsed = 0 }
    const onEnter = () => { isMouseInWindow = true }

    const ro = new ResizeObserver(resize)
    ro.observe(document.documentElement)

    if (hasPointer) {
      document.addEventListener('mousemove',  onMove,  { passive: true })
      document.addEventListener('mouseleave', onLeave)
      document.addEventListener('mouseenter', onEnter)
    }

    resize()
    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove',  onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      ro.disconnect()
    }
  }, [])

  return (
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
    />
  )
}
