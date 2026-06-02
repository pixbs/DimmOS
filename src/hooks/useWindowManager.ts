'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BASE_Z, loadWindowsFromSession, saveWindowsToSession } from '@/lib/window-state'
import type { ManagedWindow } from '@/lib/window-state'

// Re-export so existing callsites continue to work without import path changes
export type { ManagedWindow } from '@/lib/window-state'
export { BASE_Z } from '@/lib/window-state'

export interface WindowManager {
  windows: ManagedWindow[]
  primarySlug: string | null
  open: (slug: string) => void
  close: (slug: string) => void
  focus: (slug: string) => void
  /** Sets pendingMinimize=true — the window component runs its animation then calls actualMinimize */
  minimize: (slug: string) => void
  /** Completes minimize: sets minimized=true, clears pendingMinimize */
  actualMinimize: (slug: string) => void
}

function updateCosmeticUrl(
  wins: ManagedWindow[],
  realPrimary: string | null,
  cosmeticRef: { current: boolean },
): void {
  if (typeof window === 'undefined') return
  if (realPrimary !== null) return     // real route active — leave URL alone
  if (window.innerWidth < 1024) return

  const visible = wins.filter((w) => !w.minimized)
  const target =
    visible.length === 0
      ? '/'
      : `/${visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).slug}`
  // Only mark as cosmetic and replace if the URL is actually changing
  if (window.location.pathname === target) return
  cosmeticRef.current = true
  window.history.replaceState(null, '', target)
}

export function useWindowManager(): WindowManager {
  const pathname = usePathname()
  const router = useRouter()
  const pathSlug = pathname === '/' ? null : pathname.slice(1) // raw, may be cosmetic

  const [windows, setWindows] = useState<ManagedWindow[]>(() =>
    pathSlug ? [{ slug: pathSlug, zIndex: BASE_Z, minimized: false, cascadeIndex: 0, pendingMinimize: false }] : [],
  )
  // Tracks ACTUAL Next.js navigations; ignores cosmetic replaceState changes
  const [realPrimarySlug, setRealPrimarySlug] = useState<string | null>(pathSlug)

  const windowsRef = useRef(windows)
  windowsRef.current = windows

  // Monotonically increments to assign a unique cascade offset to every new slug
  const openCountRef = useRef(0)

  const realPrimarySlugRef = useRef(realPrimarySlug)
  realPrimarySlugRef.current = realPrimarySlug

  const cosmeticChangeRef = useRef(false)

  // Effect 1: restore floating windows from sessionStorage (mount only)
  useEffect(() => {
    const stored = loadWindowsFromSession()
    if (stored.length === 0) return
    setWindows((prev) => {
      const curPrimary = realPrimarySlugRef.current
      const toAdd = stored.filter(
        (w) => !prev.some((p) => p.slug === w.slug) && w.slug !== curPrimary,
      )
      if (toAdd.length === 0) return prev
      return [...prev, ...toAdd]
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: sync sessionStorage + cosmetic URL on every windows change
  useEffect(() => {
    saveWindowsToSession(windows)
    updateCosmeticUrl(windows, realPrimarySlugRef.current, cosmeticChangeRef)
  }, [windows])

  // Effect 3: handle real Next.js navigation — swap primary, keep secondaries
  const prevPathSlugRef = useRef(pathSlug)         // tracks raw pathname (may be cosmetic)
  const prevRealPrimaryRef = useRef(realPrimarySlug) // tracks real primary only
  useEffect(() => {
    if (prevPathSlugRef.current === pathSlug) return

    // Skip if triggered by our own cosmetic replaceState
    if (cosmeticChangeRef.current) {
      cosmeticChangeRef.current = false
      prevPathSlugRef.current = pathSlug // keep raw ref in sync; prevRealPrimaryRef unchanged
      return
    }

    const oldPrimary = prevRealPrimaryRef.current // real slug we're navigating AWAY from
    prevPathSlugRef.current = pathSlug
    prevRealPrimaryRef.current = pathSlug

    setRealPrimarySlug(pathSlug)
    setWindows((prev) => {
      const remaining = prev.filter(
        (w) => w.slug !== oldPrimary && w.slug !== pathSlug,
      )
      return [
        ...(pathSlug ? [{ slug: pathSlug, zIndex: BASE_Z, minimized: false, cascadeIndex: 0, pendingMinimize: false }] : []),
        ...remaining,
      ]
    })
  }, [pathSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = useCallback(
    (slug: string) => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        router.push(`/${slug}`)
        return
      }
      if (slug === realPrimarySlugRef.current) {
        const prev = windowsRef.current
        const maxZ = Math.max(...prev.map((w) => w.zIndex), BASE_Z - 1)
        setWindows(prev.map((w) => (w.slug === slug ? { ...w, zIndex: maxZ + 1, minimized: false } : w)))
        return
      }
      const prev = windowsRef.current
      let next: ManagedWindow[]
      if (prev.some((w) => w.slug === slug)) {
        const maxZ = Math.max(...prev.map((w) => w.zIndex), BASE_Z - 1)
        next = prev.map((w) => (w.slug === slug ? { ...w, zIndex: maxZ + 1, minimized: false } : w))
      } else {
        const maxZ = Math.max(...prev.map((w) => w.zIndex), BASE_Z - 1)
        const cascadeIndex = openCountRef.current++
        next = [...prev, { slug, zIndex: maxZ + 1, minimized: false, cascadeIndex, pendingMinimize: false }]
      }
      setWindows(next)
    },
    [router],
  )

  const close = useCallback(
    (slug: string) => {
      const next = windowsRef.current.filter((w) => w.slug !== slug)
      if (slug === realPrimarySlugRef.current) {
        router.push('/')
      } else {
        setWindows(next)
      }
    },
    [router],
  )

  const focus = useCallback((slug: string) => {
    const prev = windowsRef.current
    const maxZ = Math.max(...prev.map((w) => w.zIndex), BASE_Z - 1)
    setWindows(prev.map((w) => (w.slug === slug ? { ...w, zIndex: maxZ + 1, minimized: false } : w)))
  }, [])

  const minimize = useCallback((slug: string) => {
    setWindows((prev) => prev.map((w) => (w.slug === slug ? { ...w, pendingMinimize: true } : w)))
  }, [])

  const actualMinimize = useCallback((slug: string) => {
    setWindows((prev) => prev.map((w) => (w.slug === slug ? { ...w, minimized: true, pendingMinimize: false } : w)))
  }, [])

  return { windows, primarySlug: realPrimarySlug, open, close, focus, minimize, actualMinimize }
}
