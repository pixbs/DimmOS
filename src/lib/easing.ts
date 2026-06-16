/**
 * Shared easing curves for scroll-triggered section animations.
 *
 * `EASE_OUT_QUAD` is the project default for entrance animations (text reveals,
 * divider draws, image de-pixelation, number count-ups). It is the standard
 * "ease-out quad" cubic-bezier — a gentle deceleration into the resting state —
 * and is shaped as a 4-tuple so it can be passed directly to Framer Motion's
 * `transition.ease`.
 */
export const EASE_OUT_QUAD: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
