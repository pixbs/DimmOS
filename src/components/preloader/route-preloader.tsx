'use client'

import { useEffect, useRef, useState } from 'react'
import { BASE_BG, computeGrid, drawGrid } from '@/components/desktop-wallpaper/grid'

// First-load splash. Reuses the wallpaper's tile grid but drives it with a
// travelling diagonal wave instead of mouse proximity. When the page is ready a
// final wave scales every tile to 0, revealing the live site underneath, then
// the component unmounts. Mounted once in the persistent root layout, so it
// only plays on the initial/cold load — never on client-side route transitions.

// ── Wave ──────────────────────────────────────────────────────────────────────
const WAVE_COUNT = 2.4 // diagonal crests visible at once
const WAVE_SPEED = 0.9 // crest travel (cycles / second)
const MIN_WAVE_MS = 1000 // always show ≥1 full wave before revealing
const MAX_WAIT_MS = 6000 // safety: reveal even if "ready" never fires
const REVEAL_MS = 900 // reveal sweep duration
const REVEAL_BAND = 0.28 // reveal front softness (fraction of the diagonal)
const FADE_MS = 240 // final fade after tiles reach 0 (uncovers the header strip)

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
      }

      const denom = cols - 1 + (rows - 1) || 1

      // ── travelling diagonal wave → per-tile proximity ──
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const diag = (c + r) / denom // 0..1 along TL → BR
          const phase = diag * WAVE_COUNT - elapsed * WAVE_SPEED
          const wave = 0.5 + 0.5 * Math.cos(phase * Math.PI * 2) // 0..1
          proximities[r * cols + c] = wave * wave * wave
        }
      }

      // ── reveal: a front sweeps the diagonal, shrinking tiles to 0 behind it ──
      if (revealStart !== 0) {
        if (!scales) scales = new Float32Array(rows * cols)
        const rp = Math.min(1, (ts - revealStart) / REVEAL_MS)
        const front = rp * (1 + REVEAL_BAND)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const diag = (c + r) / denom
            const local = (front - diag) / REVEAL_BAND
            const shrink = local <= 0 ? 0 : local >= 1 ? 1 : local
            scales[r * cols + c] = 1 - shrink
            // bright, rounded leading edge just before each tile vanishes
            const edge = 1 - Math.abs(local - 0.5) * 2
            if (edge > 0) {
              proximities[r * cols + c] = Math.max(proximities[r * cols + c], edge)
            }
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
      className="fixed inset-0 z-9999"
      data-route-preloader=""
      role="status"
    >
      <canvas ref={canvasRef} className="pointer-events-none block" />
    </div>
  )
}
