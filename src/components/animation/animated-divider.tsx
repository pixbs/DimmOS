'use client'

import { useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_QUAD } from '@/lib/easing'
import { useSectionInView } from './use-section-in-view'

/** Props for {@link AnimatedDivider}. */
export interface AnimatedDividerProps {
  /** Line direction. Horizontal draws left→right; vertical draws top→bottom. Defaults to `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical'
  /** Extra classes (e.g. colour override; defaults to `bg-fg/10`). */
  className?: string
  /** Draw duration in seconds. Defaults to `0.6`. */
  duration?: number
}

/**
 * A 1px rule that draws itself when scrolled into view — left→right for
 * horizontal dividers, top→bottom for vertical ones — using the shared
 * ease-out-quad curve.
 *
 * Used for the column/row separators in the Summary section. Respects reduced
 * motion by rendering the line fully drawn.
 */
export function AnimatedDivider({
  orientation = 'horizontal',
  className,
  duration = 0.6,
}: AnimatedDividerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useSectionInView(ref, 0.5)
  const reduce = useReducedMotion()
  const horizontal = orientation === 'horizontal'

  const collapsed = horizontal ? { scaleX: 0 } : { scaleY: 0 }
  const drawn = horizontal ? { scaleX: 1 } : { scaleY: 1 }

  return (
    <motion.div
      ref={ref}
      data-orientation={orientation}
      className={`${horizontal ? 'h-px w-full' : 'h-full w-px'} ${className ?? 'bg-fg/10'}`}
      style={{ transformOrigin: horizontal ? 'left center' : 'center top' }}
      initial={reduce ? false : collapsed}
      animate={inView || reduce ? drawn : collapsed}
      transition={{ duration, ease: EASE_OUT_QUAD }}
    />
  )
}
