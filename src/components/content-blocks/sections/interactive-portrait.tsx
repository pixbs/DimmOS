'use client'

import { useEffect, useRef } from 'react'
import type { InteractivePortraitBlock } from '@/payload-types'

type Gaze = { x: number; y: number }

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function InteractivePortraitView({ block: _block }: { block: InteractivePortraitBlock }) {
  const rootRef = useRef<HTMLElement>(null)
  const leftPupilRef = useRef<SVGCircleElement>(null)
  const rightPupilRef = useRef<SVGCircleElement>(null)
  const leftEyeRef = useRef<SVGGElement>(null)
  const rightEyeRef = useRef<SVGGElement>(null)
  const faceRef = useRef<SVGGElement>(null)
  const gazeRef = useRef<Gaze>({ x: 0, y: 0 })
  const targetRef = useRef<Gaze>({ x: 0, y: 0 })
  const lastPointerRef = useRef(0)

  useEffect(() => {
    const rootEl = rootRef.current
    if (!rootEl) return
    const element: HTMLElement = rootEl

    const hasFinePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false
    let frame = 0
    let blinkUntil = 0
    let nextBlinkAt = performance.now() + 1200

    function setPointerTarget(ev: PointerEvent) {
      const rect = element.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const x = clamp((ev.clientX - cx) / (rect.width / 2), -1, 1)
      const y = clamp((ev.clientY - cy) / (rect.height / 2), -1, 1)
      targetRef.current = { x, y }
      lastPointerRef.current = performance.now()
    }

    function clearPointerTarget() {
      lastPointerRef.current = 0
    }

    if (hasFinePointer) {
      element.addEventListener('pointermove', setPointerTarget, { passive: true })
      element.addEventListener('pointerleave', clearPointerTarget, { passive: true })
    }

    function tick(now: number) {
      const idle = !hasFinePointer || now - lastPointerRef.current > 2600
      if (idle) {
        targetRef.current = {
          x: Math.sin(now / 1700) * 0.34 + Math.sin(now / 2900) * 0.12,
          y: Math.cos(now / 2200) * 0.16,
        }
      }

      if (now > nextBlinkAt) {
        blinkUntil = now + 130
        nextBlinkAt = now + 2400 + Math.random() * 2200
      }

      gazeRef.current = {
        x: gazeRef.current.x + (targetRef.current.x - gazeRef.current.x) * 0.12,
        y: gazeRef.current.y + (targetRef.current.y - gazeRef.current.y) * 0.12,
      }

      const { x, y } = gazeRef.current
      const pupilX = x * 2.6
      const pupilY = y * 1.8
      leftPupilRef.current?.setAttribute('cx', String(67 + pupilX))
      leftPupilRef.current?.setAttribute('cy', String(80 + pupilY))
      rightPupilRef.current?.setAttribute('cx', String(93 + pupilX))
      rightPupilRef.current?.setAttribute('cy', String(80 + pupilY))
      faceRef.current?.setAttribute('transform', `translate(${x * 1.4} ${y * 1.1})`)

      const blinkScale = now < blinkUntil ? 0.12 : 1
      leftEyeRef.current?.style.setProperty('transform', `scaleY(${blinkScale})`)
      rightEyeRef.current?.style.setProperty('transform', `scaleY(${blinkScale})`)
      element.dataset.gazeX = x.toFixed(3)
      element.dataset.gazeY = y.toFixed(3)
      element.dataset.gazeMode = idle ? 'idle' : 'pointer'

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('pointermove', setPointerTarget)
      element.removeEventListener('pointerleave', clearPointerTarget)
    }
  }, [])

  return (
    <section
      ref={rootRef}
      data-block-type="interactivePortrait"
      data-testid="interactive-portrait"
      className="flex justify-center py-2"
      aria-label="Interactive portrait"
    >
      <svg
        viewBox="0 0 160 160"
        role="img"
        aria-label="Portrait that follows pointer movement"
        className="h-36 w-36 @2xl:h-44 @2xl:w-44"
      >
        <circle cx="80" cy="80" r="66" fill="#f7f7f2" />
        <g ref={faceRef}>
          <path d="M48 72c2-24 16-37 32-37s30 13 32 37c2 23-9 51-32 51S46 95 48 72Z" fill="#f7f7f2" stroke="#111" strokeWidth="2.2" />
          <path d="M53 59c2-18 14-29 28-29 17 0 28 11 29 30-9-16-23-20-41-16-8 2-13 7-16 15Z" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M47 71c-4-7-4-17 3-22M56 49c-2-7 2-14 9-17M69 40c2-8 11-12 20-8M91 36c9-4 19 1 22 9M109 50c8 5 9 16 4 23" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M54 53c12-2 19-9 23-17M62 45c7 2 16-1 24-10M77 41c9 5 18 5 27 0M96 43c8 2 14 7 18 14M50 65c7 3 13-3 18-15" fill="none" stroke="#111" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M43 78c-6 2-5 15 3 18M117 78c6 2 5 15-3 18" fill="#f7f7f2" stroke="#111" strokeWidth="2" strokeLinecap="round" />
          <g fill="none" stroke="#111" strokeWidth="2">
            <circle cx="67" cy="80" r="10" />
            <circle cx="93" cy="80" r="10" />
            <path d="M77 80h6M57 76c-5-3-8-2-11 1M103 76c5-3 8-2 11 1" strokeLinecap="round" />
          </g>
          <g ref={leftEyeRef} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx="67" cy="80" r="4" fill="#111" />
            <circle ref={leftPupilRef} cx="67" cy="80" r="2.1" fill="#f7f7f2" />
          </g>
          <g ref={rightEyeRef} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx="93" cy="80" r="4" fill="#111" />
            <circle ref={rightPupilRef} cx="93" cy="80" r="2.1" fill="#f7f7f2" />
          </g>
          <path d="M80 84c-2 7-2 10 4 11" fill="none" stroke="#111" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M70 104c6 5 16 5 22 0" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
          <path d="M59 112c7 10 35 10 42 0" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </svg>
    </section>
  )
}
