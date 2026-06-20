'use client'

import { useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_QUAD } from '@/lib/easing'
import { useSectionInView } from './use-section-in-view'

/** Props for {@link AnimatedDivider}. */
export interface AnimatedDividerProps {
  /** Line direction. Horizontal draws left→right; vertical draws top→bottom. Defaults to `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical'
  /** Extra classes appended to the track (e.g. a `bg-*` override or visibility toggles). */
  className?: string
  /** Draw duration in seconds. Defaults to `0.6`. */
  duration?: number
}

/**
 * A 1px rule that draws itself when scrolled into view — left→right for
 * horizontal dividers, top→bottom for vertical ones — using the shared
 * ease-out-quad curve.
 *
 * Visibility is observed on the full-size **track** (not the scaling line), so
 * the IntersectionObserver still fires when the line itself starts collapsed.
 * The vertical track uses `self-stretch` so it fills its flex/grid row height.
 * Respects reduced motion by rendering the line fully drawn.
 */
export function AnimatedDivider({
  orientation = 'horizontal',
  className,
  duration = 0.6,
}: AnimatedDividerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useSectionInView(ref, 0)
  const reduce = useReducedMotion()
  const horizontal = orientation === 'horizontal'

  // Animate only the relevant axis; the other stays at its resting scale of 1.
  const collapsed = horizontal ? { scaleX: 0 } : { scaleY: 0 }
  const drawn = horizontal ? { scaleX: 1 } : { scaleY: 1 }

  return (
    <div
      ref={ref}
      data-orientation={orientation}
      className={`${horizontal ? 'h-px w-full' : 'w-px self-stretch'} overflow-hidden ${className ?? ''}`}
    >
      <motion.div
        className="h-full w-full bg-fg/20"
        // Framer-native origin (0,0 = top-left) so horizontal draws left→right
        // and vertical draws top→bottom, regardless of CSS transform-origin.
        style={{ originX: 0, originY: 0 }}
        initial={reduce ? false : collapsed}
        animate={inView || reduce ? drawn : collapsed}
        transition={{ duration, ease: EASE_OUT_QUAD }}
      />
    </div>
  )
}
