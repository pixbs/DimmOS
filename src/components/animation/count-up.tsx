'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { EASE_OUT_QUAD } from '@/lib/easing'
import { useSectionInView } from './use-section-in-view'

/** Props for {@link CountUp}. */
export interface CountUpProps {
  /** Target value to count up to. */
  value: number
  /** Static text shown before the number, e.g. `"$"`. */
  prefix?: string
  /** Static text shown after the number, e.g. `"Mil"`, `"%"`, `"+"`. */
  suffix?: string
  /** Count-up duration in seconds. Defaults to `2`. */
  duration?: number
  /** Decimal places to display. Defaults to `0`. */
  decimals?: number
  /** Classes for the wrapper element. */
  className?: string
  /** Classes for the animated number span (the big figure). */
  numberClassName?: string
  /** Classes for the prefix/suffix spans (visually distinct from the number). */
  affixClassName?: string
}

/**
 * Animate a number from 0 up to `value` once it scrolls into view, keeping any
 * `prefix`/`suffix` text static so the figure reads correctly throughout
 * (e.g. `$` 0→`12` `K`).
 *
 * Accessibility: the final value (with affixes) is rendered in a visually
 * hidden span so screen readers announce the result, while the live-updating
 * figure is `aria-hidden`. Reduced-motion users see the final value immediately.
 */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  duration = 2,
  decimals = 0,
  className,
  numberClassName,
  affixClassName,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useSectionInView(ref, 0.4)
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: EASE_OUT_QUAD,
      onUpdate: (latest) => setDisplay(latest),
    })
    return () => controls.stop()
  }, [inView, reduce, value, duration])

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const finalFormatted = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{`${prefix}${finalFormatted}${suffix}`}</span>
      <span aria-hidden>
        {prefix && (
          <span data-count-affix="" className={affixClassName}>
            {prefix}
          </span>
        )}
        <span data-count-number="" className={numberClassName}>
          {formatted}
        </span>
        {suffix && (
          <span data-count-affix="" className={affixClassName}>
            {suffix}
          </span>
        )}
      </span>
    </span>
  )
}
