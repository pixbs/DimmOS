/**
 * Scroll-triggered animation toolkit for content sections.
 *
 * All primitives trigger on *true* visibility inside the window scroll
 * container (see {@link ScrollRoot} / {@link useScrollRoot}) and share the
 * `EASE_OUT_QUAD` curve. Import section components from here.
 */
export { ScrollRoot, useScrollRoot } from './scroll-root-context'
export { useSectionInView } from './use-section-in-view'
export { AnimatedText, type AnimatedTextProps } from './animated-text'
export { AnimatedDivider, type AnimatedDividerProps } from './animated-divider'
export { CountUp, type CountUpProps } from './count-up'
export { PixelatedImage, type PixelatedImageProps } from './pixelated-image'
export {
  ParallaxImagePair,
  type ParallaxImagePairProps,
  type ParallaxLayer,
} from './parallax-image-pair'
