'use client'

import { useRef, type ElementType } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { splitText, type SplitMode } from '@/lib/splitText'
import { EASE_OUT_QUAD } from '@/lib/easing'
import { useSectionInView } from './use-section-in-view'

/** Props for {@link AnimatedText}. */
export interface AnimatedTextProps {
  /** The text to reveal, passed as children. Always rendered intact (visually hidden) for screen readers. */
  children: string
  /** Animate whole words (default) or individual letters. */
  split?: SplitMode
  /** Wrapper element type, e.g. `'h1'`, `'h2'`, `'span'`. Defaults to `'span'`. */
  as?: ElementType
  /** Classes applied to the wrapper element (font size, weight, colour, …). */
  className?: string
  /** Per-unit delay in seconds; larger = more pronounced cascade. Defaults to `0.04`. */
  stagger?: number
  /** Duration of each unit's slide-up, in seconds. Defaults to `0.6`. */
  duration?: number
}

/**
 * Reveal a title by sliding each word (or letter) up from below as it scrolls
 * into view inside the window scroll container.
 *
 * Accessibility: the full string is rendered once in a visually-hidden span so
 * screen readers announce natural text; the per-unit animated spans are
 * `aria-hidden`. When the user prefers reduced motion the text is shown at rest
 * with no animation.
 *
 * @see useSectionInView for the true-visibility trigger.
 */
export function AnimatedText({
  children,
  split = 'words',
  as,
  className,
  stagger = 0.04,
  duration = 0.6,
}: AnimatedTextProps) {
  const Wrapper = (as ?? 'span') as ElementType
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useSectionInView(ref)
  const reduce = useReducedMotion()
  const { words } = splitText(children, split)

  let unitIndex = 0

  return (
    <Wrapper ref={ref} className={className}>
      <span className="sr-only">{children}</span>
      <span aria-hidden className="inline-flex flex-wrap gap-x-[0.25em]">
        {words.map((units, wi) => (
          <span key={wi} className="inline-flex whitespace-nowrap">
            {units.map((unit, ui) => {
              const i = unitIndex++
              return (
                <span key={ui} className="inline-block overflow-hidden pb-[0.12em] mb-[-0.12em]">
                  <motion.span
                    data-animated-unit=""
                    className="inline-block"
                    initial={reduce ? false : { y: '110%' }}
                    animate={inView || reduce ? { y: '0%' } : { y: '110%' }}
                    transition={{ duration, ease: EASE_OUT_QUAD, delay: reduce ? 0 : i * stagger }}
                  >
                    {unit}
                  </motion.span>
                </span>
              )
            })}
          </span>
        ))}
      </span>
    </Wrapper>
  )
}
