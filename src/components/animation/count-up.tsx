'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { EASE_OUT_QUAD } from '@/lib/easing'
import { parseStat } from '@/lib/parseStat'
import { useSectionInView } from './use-section-in-view'

/** Props for {@link CountUp}. */
export interface CountUpProps {
  /**
   * The stat to display, as a single string — e.g. `"30Mil"`, `"$30,000"`,
   * `"21%"`, `"1,200+"`. The numeric run counts up from 0 while any surrounding
   * text (currency, units, sign) stays static. See {@link parseStat}.
   */
  children: string
  /** Count-up duration in seconds. Defaults to `2`. */
  duration?: number
  /** Classes for the wrapper element. */
  className?: string
  /** Classes for the animated number span (the big figure). */
  numberClassName?: string
  /** Classes for the prefix/suffix spans (visually distinct from the number). */
  affixClassName?: string
}

/**
 * Animate the number inside a stat string from 0 up to its value once it scrolls
 * into view, keeping any surrounding prefix/suffix text static so the figure
 * reads correctly throughout (e.g. `$` 0→`30,000`).
 *
 * The string is split into number + affixes by {@link parseStat}; thousands
 * separators and decimal places are inferred from the source and reproduced as
 * the count-up runs.
 *
 * Accessibility: the original string is rendered intact in a visually hidden
 * span so screen readers announce the result, while the live-updating figure is
 * `aria-hidden`. Reduced-motion users see the final value immediately.
 */
export function CountUp({
  children,
  duration = 2,
  className,
  numberClassName,
  affixClassName,
}: CountUpProps) {
  const { value, prefix, suffix, decimals } = parseStat(children)
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

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{children}</span>
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
