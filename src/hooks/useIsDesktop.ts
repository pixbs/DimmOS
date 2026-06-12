'use client'

import { useState, useEffect } from 'react'
import { DESKTOP_BREAKPOINT } from '@/lib/breakpoints'

/**
 * Tri-state viewport check: null before the first client-side measurement
 * (SSR / hydration), then true/false tracking resize. The null state lets
 * consumers (preloader total, window mounting) defer until the viewport is
 * actually known instead of assuming mobile.
 */
export function useIsDesktop(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    function check() {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    }
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  return isDesktop
}
