'use client'

import { useEffect, useId, useRef, type CSSProperties, type SVGProps } from 'react'
import type { InteractivePortraitBlock } from '@/payload-types'
import {
  AVATAR_ELEMENTS,
  BLINK_TARGETS,
  LOOK_SPECS,
  type AvatarElement,
  type LookAttributeSpec,
} from './interactive-portrait-source'

type Gaze = { x: number; y: number }
type SvgLookElement = SVGPathElement | SVGCircleElement

const BLINK_DELAYS_MS = [1800, 3600, 2400, 5200, 3100]

const PORTRAIT_STYLE = {
  '--circle-background-color': '#ffffff',
  '--line-color': '#000000',
  '--pupil-color': '#000000',
  '--line-width': '1.5px',
  '--skin-left-color': '#ffffff',
  '--skin-right-color': '#ffffff',
  '--shirt-left-color': '#000000',
  '--shirt-right-color': '#000000',
  '--hair-left-color': '#c9c9c9',
  '--hair-right-color': '#c9c9c9',
  '--hair-shadow-color': '#c9c9c9',
  '--hair-accent-color': '#c9c9c9',
  '--ear-left-color': '#ffffff',
  '--ear-right-color': '#ffffff',
} as CSSProperties

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function rebuild(parts: string[], values: number[]) {
  let out = ''
  for (let i = 0; i < values.length; i += 1) {
    out += `${parts[i]}${Math.round(values[i] * 10000) / 10000}`
  }
  return out + parts[parts.length - 1]
}

function interpolateNumbers(spec: LookAttributeSpec, x: number, y: number) {
  const hx = Math.max(0, x)
  const lx = Math.max(0, -x)
  const dy = Math.max(0, y)
  const uy = Math.max(0, -y)

  return spec.nums.c.map(
    (center, i) =>
      center +
      (spec.nums.r[i] - center) * hx +
      (spec.nums.l[i] - center) * lx +
      (spec.nums.d[i] - center) * dy +
      (spec.nums.u[i] - center) * uy,
  )
}

function eyelidBlinkValues(values: number[], pupilCy: number, progress: number) {
  if (progress === 0) return values
  const out = [...values]
  const yOffsets = [0.95, 0.4, 0.05, 0, 0, 0.05, 0.4, 0.95]

  for (let i = 1, yIndex = 0; i < out.length; i += 2, yIndex += 1) {
    const targetY = pupilCy + (yOffsets[yIndex] ?? 0)
    out[i] += (targetY - out[i]) * progress
  }

  return out
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
}

function blinkProgressAt(now: number, nextBlinkAt: number) {
  const closeMs = 115
  const holdMs = 45
  const openMs = 165
  const elapsed = now - nextBlinkAt

  if (elapsed < 0) return { progress: 0, complete: false }
  if (elapsed < closeMs) return { progress: easeInOut(elapsed / closeMs), complete: false }
  if (elapsed < closeMs + holdMs) return { progress: 1, complete: false }
  if (elapsed < closeMs + holdMs + openMs) {
    return {
      progress: 1 - easeInOut((elapsed - closeMs - holdMs) / openMs),
      complete: false,
    }
  }
  return { progress: 0, complete: true }
}

function renderAvatarElement(element: AvatarElement) {
  const attrs = {
    ...element.attrs,
    'data-look-index': element.lookIndex,
  } as SVGProps<SVGPathElement & SVGCircleElement>

  if (element.tag === 'path') {
    return <path key={element.lookIndex} {...attrs} />
  }

  return <circle key={element.lookIndex} {...attrs} />
}

export function InteractivePortraitView({ block: _block }: { block: InteractivePortraitBlock }) {
  const rootRef = useRef<HTMLElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gazeRef = useRef<Gaze>({ x: 0, y: 0 })
  const targetRef = useRef<Gaze>({ x: 0, y: 0 })
  const lastPointerRef = useRef(0)
  const rawClipId = useId()
  const clipId = `avatar-circle-${rawClipId.replace(/:/g, '')}`

  useEffect(() => {
    const rootEl = rootRef.current
    const svgEl = svgRef.current
    if (!rootEl || !svgEl) return

    const rootElement: HTMLElement = rootEl
    const svgElement: SVGSVGElement = svgEl
    const hasFinePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false
    const elements = new Map<string, SvgLookElement>()
    svgElement.querySelectorAll<SvgLookElement>('[data-look-index]').forEach((element) => {
      const index = element.getAttribute('data-look-index')
      if (index) elements.set(index, element)
    })
    let frame = 0
    let nextBlinkAt = 0
    let blinkDelayIndex = 0
    let blinkProgress = 0

    function scheduleNextBlink(now: number) {
      nextBlinkAt = now + BLINK_DELAYS_MS[blinkDelayIndex]
      blinkDelayIndex = (blinkDelayIndex + 1) % BLINK_DELAYS_MS.length
    }

    function applyOriginalEyelidBlink(x: number, y: number) {
      const leftLidEl = elements.get(BLINK_TARGETS.leftLid)
      const rightLidEl = elements.get(BLINK_TARGETS.rightLid)
      const leftPupilEl = elements.get(BLINK_TARGETS.leftPupil)
      const rightPupilEl = elements.get(BLINK_TARGETS.rightPupil)
      if (!leftLidEl || !rightLidEl || !leftPupilEl || !rightPupilEl) return

      const leftLidSpec = LOOK_SPECS[BLINK_TARGETS.leftLid]?.d
      const rightLidSpec = LOOK_SPECS[BLINK_TARGETS.rightLid]?.d
      const leftPupilSpec = LOOK_SPECS[BLINK_TARGETS.leftPupil]
      const rightPupilSpec = LOOK_SPECS[BLINK_TARGETS.rightPupil]
      if (!leftLidSpec || !rightLidSpec || !leftPupilSpec || !rightPupilSpec) return

      const leftLidValues = interpolateNumbers(leftLidSpec, x, y)
      const rightLidValues = interpolateNumbers(rightLidSpec, x, y)
      const leftCy = leftPupilSpec.cy ? interpolateNumbers(leftPupilSpec.cy, x, y)[0] : 0
      const rightCy = rightPupilSpec.cy ? interpolateNumbers(rightPupilSpec.cy, x, y)[0] : 0

      leftLidEl.setAttribute('d', rebuild(leftLidSpec.parts, eyelidBlinkValues(leftLidValues, leftCy, blinkProgress)))
      rightLidEl.setAttribute('d', rebuild(rightLidSpec.parts, eyelidBlinkValues(rightLidValues, rightCy, blinkProgress)))

      const visibleScale = Math.max(0, 1 - blinkProgress * 1.3)
      if (leftPupilSpec.r && rightPupilSpec.r) {
        const leftBaseR = interpolateNumbers(leftPupilSpec.r, x, y)[0]
        const rightBaseR = interpolateNumbers(rightPupilSpec.r, x, y)[0]
        leftPupilEl.setAttribute('r', String(Math.max(0.001, leftBaseR * visibleScale)))
        rightPupilEl.setAttribute('r', String(Math.max(0.001, rightBaseR * visibleScale)))
      }
      leftPupilEl.setAttribute('opacity', blinkProgress > 0.96 ? '0' : '1')
      rightPupilEl.setAttribute('opacity', blinkProgress > 0.96 ? '0' : '1')
    }

    function applyLook(x: number, y: number) {
      const lookX = clamp(x, -1, 1)
      const lookY = clamp(y, -1, 1)

      for (const [index, attrs] of Object.entries(LOOK_SPECS)) {
        const el = elements.get(index)
        if (!el) continue

        for (const [attr, spec] of Object.entries(attrs)) {
          const values = interpolateNumbers(spec, lookX, lookY)
          el.setAttribute(attr, rebuild(spec.parts, values))
        }
      }

      applyOriginalEyelidBlink(lookX, lookY)
    }

    function pointerToLook(clientX: number, clientY: number) {
      const box = svgElement.getBoundingClientRect()
      const cx = box.left + box.width / 2
      const cy = box.top + box.height / 2
      targetRef.current = {
        x: (clientX - cx) / (box.width / 2),
        y: (clientY - cy) / (box.height / 2),
      }
      lastPointerRef.current = performance.now()
    }

    function onPointerMove(event: PointerEvent) {
      pointerToLook(event.clientX, event.clientY)
    }

    function onPointerDown(event: PointerEvent) {
      rootElement.setPointerCapture?.(event.pointerId)
      pointerToLook(event.clientX, event.clientY)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' && event.key !== '0') return
      targetRef.current = { x: 0, y: 0 }
      lastPointerRef.current = performance.now()
    }

    function tick(now: number) {
      if (nextBlinkAt === 0) scheduleNextBlink(now)

      const idle = !hasFinePointer || now - lastPointerRef.current > 2600
      if (idle) {
        targetRef.current = {
          x: Math.sin(now / 1700) * 0.34 + Math.sin(now / 2900) * 0.12,
          y: Math.cos(now / 2200) * 0.16,
        }
      }

      const blink = blinkProgressAt(now, nextBlinkAt)
      blinkProgress = blink.progress
      if (blink.complete) scheduleNextBlink(now)

      gazeRef.current = {
        x: gazeRef.current.x + (targetRef.current.x - gazeRef.current.x) * 0.12,
        y: gazeRef.current.y + (targetRef.current.y - gazeRef.current.y) * 0.12,
      }

      const lookX = clamp(gazeRef.current.x, -1, 1)
      const lookY = clamp(gazeRef.current.y, -1, 1)
      applyLook(lookX, lookY)
      rootElement.dataset.gazeX = lookX.toFixed(3)
      rootElement.dataset.gazeY = lookY.toFixed(3)
      rootElement.dataset.gazeMode = idle ? 'idle' : 'pointer'
      rootElement.dataset.blinkProgress = blinkProgress.toFixed(3)

      frame = requestAnimationFrame(tick)
    }

    if (hasFinePointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      rootElement.addEventListener('pointerdown', onPointerDown, { passive: true })
    }
    window.addEventListener('keydown', onKeyDown)

    applyLook(0, 0)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointerMove)
      rootElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <section
      ref={rootRef}
      data-block-type="interactivePortrait"
      data-testid="interactive-portrait"
      className="flex justify-center py-2"
      aria-label="Interactive portrait"
      style={PORTRAIT_STYLE}
    >
      <div className="aspect-square h-36 overflow-hidden rounded-full bg-bgs @2xl:h-44">
        <svg
          ref={svgRef}
          viewBox="0 0 171 171"
          role="img"
          aria-label="Portrait that follows pointer movement"
          className="block h-full w-full bg-bgs"
        >
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <circle cx="85.5" cy="85.5" r="85.5" />
            </clipPath>
          </defs>
          <circle cx="85.5" cy="85.5" r="85.5" fill="var(--circle-background-color)" />
          <g clipPath={`url(#${clipId})`}>
            <g transform="translate(0 5.5)">
              {AVATAR_ELEMENTS.map((element) => renderAvatarElement(element))}
            </g>
          </g>
        </svg>
      </div>
    </section>
  )
}
