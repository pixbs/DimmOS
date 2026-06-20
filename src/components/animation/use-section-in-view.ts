'use client'

import { useInView } from 'framer-motion'
import type { RefObject } from 'react'
import { useScrollRoot } from './scroll-root-context'

/**
 * Shared "is this element actually visible to the user yet?" hook for section
 * animations.
 *
 * Observes `ref` against the nearest window scroll container (see
 * {@link useScrollRoot}) rather than the viewport, so animations only fire when
 * content is truly on screen inside an overflow-scrolled window — not while it
 * sits scrolled out of view. Fires once and stays `true` (entrance animations
 * do not replay).
 *
 * @param ref - The element whose visibility gates the animation.
 * @param amount - Fraction of the element that must be visible to trigger (0–1).
 * @returns `true` once the element has been sufficiently visible.
 */
export function useSectionInView(ref: RefObject<Element | null>, amount: number = 0.3): boolean {
  const root = useScrollRoot()
  return useInView(ref, { root, amount, once: true })
}
