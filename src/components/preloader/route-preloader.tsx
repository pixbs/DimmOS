'use client'

import { useEffect, useRef, useState } from 'react'
import { BASE_BG, computeGrid, drawGrid } from '@/components/desktop-wallpaper/grid'

// First-load splash. Reuses the wallpaper's tile grid but drives it with a
// travelling diagonal wave instead of mouse proximity. When the page is ready a
// final wave sweeps across: each grey tile rounds up — exposing the live site
// through its corners — while the circle scales to 0, then the overlay unmounts.
// Mounted once in the persistent root layout, so it only plays on the initial/
// cold load — never on client-side route transitions.

// ── Wave ──────────────────────────────────────────────────────────────────────
const WAVE_SPEED = 0.9 // crest travel (cycles / second)
const MIN_WAVE_MS = 1000 // always show ≥1 full wave before revealing
const MAX_WAIT_MS = 6000 // safety: reveal even if "ready" never fires
const REVEAL_MS = 1200 // reveal sweep duration
const REVEAL_BAND = 0.28 // reveal front softness (fraction of the diagonal)
const FADE_MS = 240 // final fade after tiles reach 0 (uncovers the header strip)

// Diagonal crests visible at once. Denser grids (desktop) get longer waves so
// the sweep reads as one big wave rather than a fine ripple — tile size is
// unchanged, only the wavelength grows with column count.
function waveCountFor(cols: number): number {
  if (cols >= 32) return 1.2
  if (cols >= 20) return 1.5
  if (cols >= 12) return 2.0
  return 2.4
}

export function RoutePreloader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const ctxObj = canvasEl.getContext('2d')
    if (!ctxObj) return
    const canvas = canvasEl
    const ctx = ctxObj

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let headerH = 0
    let vw = 0
    let vh = 0
    let cols = 6
    let rows = 1
    let tileSize = 1
    let waveCount = waveCountFor(6)
    let proximities = new Float32Array(0)
    let scales: Float32Array | null = null

    let rafId = 0
    let startTs = 0
    let ready = false
    let revealStart = 0 // timestamp reveal began (0 = not started)
    let finished = false

    // The wallpaper sits below a fixed-height header; match that offset so the
    // preloader grid lines up with the wallpaper grid at the reveal handoff.
    function readHeaderHeight(): number {
      const el = document.querySelector('header')
      if (el) {
        const h = el.getBoundingClientRect().height
        if (h > 0) return h
      }
      const root = document.documentElement
      const raw = getComputedStyle(root).getPropertyValue('--header-height').trim()
      if (raw.endsWith('rem')) return parseFloat(raw) * parseFloat(getComputedStyle(root).fontSize || '16')
      if (raw.endsWith('px')) return parseFloat(raw)
      return 40
    }

    function resize() {
      headerH = readHeaderHeight()
      vw = window.innerWidth
      vh = window.innerHeight
      canvas.width = Math.round(vw * dpr)
      canvas.height = Math.round(vh * dpr)
      canvas.style.width = vw + 'px'
      canvas.style.height = vh + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const g = computeGrid(vw, Math.max(1, vh - headerH))
      cols = g.cols
      rows = g.rows
      tileSize = g.tileSize
      waveCount = waveCountFor(cols)
      proximities = new Float32Array(rows * cols)
      scales = null
    }

    function finish() {
      if (finished) return
      finished = true
      cancelAnimationFrame(rafId)
      const el = containerRef.current
      if (el) {
        el.style.transition = `opacity ${FADE_MS}ms ease`
        el.style.opacity = '0'
        window.setTimeout(() => setDone(true), FADE_MS)
      } else {
        setDone(true)
      }
    }

    function draw(ts: number) {
      if (startTs === 0) startTs = ts
      const elapsed = (ts - startTs) / 1000

      if (revealStart === 0 && ready && ts - startTs >= MIN_WAVE_MS) {
        revealStart = ts
        // Drop the opaque backdrop so the canvas's cleared corners now expose
        // the live site instead of the solid cover.
        if (containerRef.current) containerRef.current.style.backgroundColor = 'transparent'
      }

      const denom = cols - 1 + (rows - 1) || 1

      // ── travelling diagonal wave → per-tile proximity ──
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const diag = (c + r) / denom // 0..1 along TL → BR
          const phase = diag * waveCount - elapsed * WAVE_SPEED
          const wave = 0.5 + 0.5 * Math.cos(phase * Math.PI * 2) // 0..1
          proximities[r * cols + c] = wave * wave * wave
        }
      }

      // ── reveal: a front sweeps the diagonal. Ahead of it, tiles stay full grey
      //    squares (opaque cover). As the front reaches a tile it rounds the
      //    corners up — exposing the site behind them (brand layer off + canvas
      //    cleared) — then the resulting circle scales down to 0.
      if (revealStart !== 0) {
        if (!scales) scales = new Float32Array(rows * cols)
        const rp = Math.min(1, (ts - revealStart) / REVEAL_MS)
        const front = rp * (1 + REVEAL_BAND)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const diag = (c + r) / denom
            const local = (front - diag) / REVEAL_BAND
            const p = local <= 0 ? 0 : local >= 1 ? 1 : local // 0 ahead → 1 gone
            // round up first (site peeks through the corners), holding rounded…
            proximities[r * cols + c] = Math.min(1, p / 0.45)
            // …then shrink the circle to nothing
            scales[r * cols + c] = 1 - (p <= 0.3 ? 0 : Math.min(1, (p - 0.3) / 0.7))
          }
        }
        if (rp >= 1) {
          finish()
          return
        }
      }

      // Grid draws below the header; translate so tile (0,0) starts at headerH —
      // matching the wallpaper. clearRect during reveal only touches this region,
      // so the header strip keeps its dark cover until the final fade.
      ctx.save()
      ctx.translate(0, headerH)
      drawGrid(ctx, {
        cols,
        rows,
        tileSize,
        proximities,
        scales: scales ?? undefined,
        clear: revealStart !== 0,
        brand: revealStart === 0, // during reveal, corners expose the site — not the brand
        width: vw,
        height: Math.max(1, vh - headerH),
      })
      ctx.restore()

      if (revealStart === 0 && headerH > 0) {
        ctx.fillStyle = BASE_BG
        ctx.fillRect(0, 0, vw, headerH)
      }

      rafId = requestAnimationFrame(draw)
    }

    function markReady() {
      ready = true
    }

    const ro = new ResizeObserver(resize)
    ro.observe(document.documentElement)

    if (document.readyState === 'complete') markReady()
    else window.addEventListener('load', markReady, { once: true })
    const maxTimer = window.setTimeout(markReady, MAX_WAIT_MS)

    resize()

    if (reduced) {
      // Accessibility: no sweeping animation — draw a static cover and reveal on ready.
      const drawStatic = () => {
        ctx.save()
        ctx.translate(0, headerH)
        drawGrid(ctx, { cols, rows, tileSize, proximities, width: vw, height: Math.max(1, vh - headerH) })
        ctx.restore()
        if (headerH > 0) {
          ctx.fillStyle = BASE_BG
          ctx.fillRect(0, 0, vw, headerH)
        }
      }
      const tick = () => {
        drawStatic() // redraw each frame so a resize (which clears the canvas) never uncovers early
        if (ready) finish()
        else rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    } else {
      rafId = requestAnimationFrame(draw)
    }

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('load', markReady)
      window.clearTimeout(maxTimer)
      ro.disconnect()
    }
  }, [])

  if (done) return null

  return (
    <div
      ref={containerRef}
      aria-label="Loading"
      // pointer-events-none: this is a decorative reveal over an already-loaded
      // page, so it must not trap input while it plays (the page beneath stays
      // interactive — e.g. dismissing the startup sheet during the splash).
      className="pointer-events-none fixed inset-0 z-9999"
      data-route-preloader=""
      role="status"
      // Opaque until the reveal begins, so a fast load never flashes the site
      // before the canvas has painted its first cover frame.
      style={{ backgroundColor: BASE_BG }}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
