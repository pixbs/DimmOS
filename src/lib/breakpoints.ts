// Keep in sync with Tailwind's lg: breakpoint and the @media (min-width: 1024px)
// queries in src/app/(frontend)/styles.css — desktop window chrome and the
// floating-window system activate at this width.
export const DESKTOP_BREAKPOINT = 1024

export const DESKTOP_MEDIA_QUERY = `(min-width: ${DESKTOP_BREAKPOINT}px)`

/**
 * SSR-safe synchronous check for event handlers and non-React contexts.
 * Returns false during SSR — callers that need to distinguish "SSR" from
 * "mobile" must keep their own typeof window guard.
 */
export function isDesktopViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
}
