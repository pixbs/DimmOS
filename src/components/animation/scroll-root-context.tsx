'use client'

import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react'

/**
 * The scroll container that section animations should observe against.
 *
 * Window/article content scrolls inside a `.win-scroll` element, not the
 * document viewport, so an `IntersectionObserver` rooted at the viewport would
 * fire too early (or never) for content hidden behind the window's overflow.
 * This context threads a ref to the nearest scroll container down to the
 * animation hooks. The default value is a stable `{ current: null }` ref, which
 * tells consumers to fall back to the viewport (e.g. plain SSR pages with no
 * surrounding window).
 */
const ScrollRootContext = createContext<RefObject<HTMLElement | null>>({ current: null })

/**
 * Render a scroll container and expose its element to descendant animation
 * hooks via {@link useScrollRoot}.
 *
 * Drop-in for the scrolling `<div>` in `WindowScaffold`: pass the same
 * `className` so styling is unchanged. Children may be server-rendered.
 */
export function ScrollRoot({
  children,
  className,
  ...rest
}: {
  children: ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLElement | null>(null)
  return (
    <ScrollRootContext.Provider value={ref}>
      <div ref={ref as RefObject<HTMLDivElement>} className={className} {...rest}>
        {children}
      </div>
    </ScrollRootContext.Provider>
  )
}

/**
 * Get a ref to the nearest scroll container provided by {@link ScrollRoot}.
 *
 * Returns a stable `{ current: null }` ref when there is no surrounding
 * `ScrollRoot`, in which case `IntersectionObserver`/`useScroll` consumers
 * should treat the document viewport as the root.
 */
export function useScrollRoot(): RefObject<HTMLElement | null> {
  return useContext(ScrollRootContext)
}
