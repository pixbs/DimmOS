'use client'

import { useEffect } from 'react'
import { isDesktopViewport } from '@/lib/breakpoints'

/**
 * Keeps a mobile bottom-sheet's pinned footer above the on-screen keyboard.
 *
 * `position: fixed` panels are laid out against the layout viewport, so the
 * soft keyboard covers anything anchored to the bottom. We track the visual
 * viewport and expose the keyboard height as a `--keyboard-inset` CSS var on
 * the panel; CSS raises the panel's `bottom` by that amount, lifting the
 * footer into view while the scroll body shrinks. Desktop is a no-op.
 */
export function useKeyboardInset(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return

    function update() {
      const el = ref.current
      if (!el) return
      if (isDesktopViewport()) {
        el.style.removeProperty('--keyboard-inset')
        return
      }
      // Height hidden behind the keyboard (and any browser chrome below the fold).
      const inset = Math.max(0, window.innerHeight - (vv!.height + vv!.offsetTop))
      el.style.setProperty('--keyboard-inset', `${Math.round(inset)}px`)
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      ref.current?.style.removeProperty('--keyboard-inset')
    }
  }, [ref])
}
