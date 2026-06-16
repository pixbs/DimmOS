'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { bufferSize, pixelationSteps } from '@/lib/pixelate'
import { useSectionInView } from './use-section-in-view'

/** Props for {@link PixelatedImage}. */
export interface PixelatedImageProps {
  /** Image source URL (a Payload media URL). */
  src: string
  /** Alt text. */
  alt: string
  /** Intrinsic width (for `next/image` and aspect ratio). */
  width: number
  /** Intrinsic height (for `next/image` and aspect ratio). */
  height: number
  /** Classes for the wrapper (sizing / aspect / rounding). */
  className?: string
  /** Classes for the underlying `next/image`. Defaults to `h-full w-full object-cover`. */
  imageClassName?: string
  /** Pass through to `next/image` for above-the-fold images. */
  priority?: boolean
  /** Number of de-pixelation frames. Defaults to `14`. */
  steps?: number
  /** Starting resolution factor (≈ how blocky the first frame is). Defaults to `0.05`. */
  minResolution?: number
  /** Milliseconds between frames. Defaults to `45`. */
  stepMs?: number
}

/** Cap the transient canvas buffer width; the real `next/image` provides final crispness. */
const MAX_DRAW_WIDTH = 480

/**
 * Render an image that resolves from a heavily pixelated canvas into a crisp
 * `next/image` once it scrolls into view.
 *
 * A `<canvas>` overlays the real image and is drawn at a climbing internal
 * resolution (see {@link pixelationSteps}); when the sequence finishes the
 * canvas is removed, revealing the optimized `next/image` underneath. The real
 * image is always in the DOM (good for SSR/SEO and no-JS), so environments
 * without a 2D canvas context (e.g. jsdom) simply show it immediately.
 * Reduced-motion users skip the effect entirely.
 */
export function PixelatedImage({
  src,
  alt,
  width,
  height,
  className,
  imageClassName,
  priority,
  steps = 14,
  minResolution = 0.05,
  stepMs = 45,
}: PixelatedImageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inView = useSectionInView(wrapperRef, 0.2)
  const reduce = useReducedMotion()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (reduce) {
      setDone(true)
      return
    }
    if (!inView || done) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      // No canvas support (e.g. jsdom) — just show the real image.
      setDone(true)
      return
    }

    const ratio = height / width
    const dw = Math.min(width, MAX_DRAW_WIDTH)
    const dh = Math.max(1, Math.round(dw * ratio))
    canvas.width = dw
    canvas.height = dh
    ctx.imageSmoothingEnabled = false

    const frames = pixelationSteps(steps, minResolution)
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    let raf = 0
    let cancelled = false
    let stepIdx = 0
    let lastTime = 0

    const tick = (t: number) => {
      if (cancelled) return
      if (!lastTime) lastTime = t
      if (t - lastTime >= stepMs) {
        lastTime = t
        stepIdx++
      }
      const res = frames[Math.min(stepIdx, frames.length - 1)]
      const { width: bw, height: bh } = bufferSize(dw, dh, res)
      ctx.clearRect(0, 0, dw, dh)
      ctx.drawImage(img, 0, 0, bw, bh)
      ctx.drawImage(canvas, 0, 0, bw, bh, 0, 0, dw, dh)
      if (stepIdx >= frames.length - 1) {
        setDone(true)
        return
      }
      raf = requestAnimationFrame(tick)
    }

    img.onload = () => {
      raf = requestAnimationFrame(tick)
    }
    img.onerror = () => setDone(true)
    img.src = src

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [inView, reduce, done, src, width, height, steps, minResolution, stepMs])

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${className ?? ''}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={imageClassName ?? 'h-full w-full object-cover'}
      />
      {!done && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ imageRendering: 'pixelated', backgroundColor: 'var(--color-bg)' }}
        />
      )}
    </div>
  )
}
