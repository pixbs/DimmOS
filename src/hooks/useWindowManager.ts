'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BASE_Z, loadWindowsFromSession, saveWindowsToSession } from '@/lib/window-state'
import type { ManagedWindow } from '@/lib/window-state'
import { getOrCreatePromise, evictPromises } from '@/lib/window-promise-cache'
import { isDesktopViewport } from '@/lib/breakpoints'

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
  /** Push newSlug onto the window's history stack and make it the current content */
  navigateInWindow: (rootSlug: string, newSlug: string) => void
  /** Go back one step in the window's history stack */
  backInWindow: (rootSlug: string) => void
  /** Go forward one step in the window's history stack */
  forwardInWindow: (rootSlug: string) => void
}

function newWindowEntry(slug: string, zIndex: number, cascadeIndex: number): ManagedWindow {
  return {
    rootSlug: slug,
    slug,
    historyStack: [slug],
    historyIndex: 0,
    zIndex,
    minimized: false,
    cascadeIndex,
    pendingMinimize: false,
  }
}

function updateCosmeticUrl(
  wins: ManagedWindow[],
  realPrimary: string | null,
  cosmeticRef: { current: boolean },
): void {
  if (typeof window === 'undefined') return
  if (realPrimary !== null) return     // real route active — leave URL alone
  if (!isDesktopViewport()) return

  const visible = wins.filter((w) => !w.minimized)
  const target =
    visible.length === 0
      ? '/'
      : `/${visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).rootSlug}`
  if (window.location.pathname === target) return
  cosmeticRef.current = true
  window.history.replaceState(null, '', target)
}

export function useWindowManager(): WindowManager {
  const pathname = usePathname()
  const router = useRouter()
  const pathSlug = pathname === '/' ? null : pathname.slice(1)

  const [windows, setWindows] = useState<ManagedWindow[]>(() =>
    pathSlug ? [newWindowEntry(pathSlug, BASE_Z, 0)] : [],
  )
  const [realPrimarySlug, setRealPrimarySlug] = useState<string | null>(pathSlug)

  const windowsRef = useRef(windows)
  windowsRef.current = windows

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
        (w) => !prev.some((p) => p.rootSlug === w.rootSlug) && w.rootSlug !== curPrimary,
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
  const prevPathSlugRef = useRef(pathSlug)
  const prevRealPrimaryRef = useRef(realPrimarySlug)
  useEffect(() => {
    if (prevPathSlugRef.current === pathSlug) return

    if (cosmeticChangeRef.current) {
      cosmeticChangeRef.current = false
      prevPathSlugRef.current = pathSlug
      return
    }

    const oldPrimary = prevRealPrimaryRef.current
    prevPathSlugRef.current = pathSlug
    prevRealPrimaryRef.current = pathSlug

    setRealPrimarySlug(pathSlug)
    setWindows((prev) => {
      const remaining = prev.filter(
        (w) => w.rootSlug !== oldPrimary && w.rootSlug !== pathSlug,
      )
      return [
        ...(pathSlug ? [newWindowEntry(pathSlug, BASE_Z, 0)] : []),
        ...remaining,
      ]
    })
  }, [pathSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = useCallback(
    (slug: string) => {
      if (typeof window !== 'undefined' && !isDesktopViewport()) {
        router.push(`/${slug}`)
        return
      }
      if (slug === realPrimarySlugRef.current) {
        const prev = windowsRef.current
        const maxZ = Math.max(...prev.map((w) => w.zIndex), BASE_Z - 1)
        setWindows(prev.map((w) => (w.rootSlug === slug ? { ...w, zIndex: maxZ + 1, minimized: false } : w)))
        return
      }
      const prev = windowsRef.current
      if (prev.some((w) => w.rootSlug === slug)) {
        const maxZ = Math.max(...prev.map((w) => w.zIndex), BASE_Z - 1)
        // Reset navigation to root — shortcut represents the root content of the window.
        setWindows(prev.map((w) =>
          w.rootSlug === slug
            ? { ...w, zIndex: maxZ + 1, minimized: false, slug: w.rootSlug, historyStack: [w.rootSlug], historyIndex: 0 }
            : w,
        ))
      } else {
        const maxZ = Math.max(...prev.map((w) => w.zIndex), BASE_Z - 1)
        const cascadeIndex = openCountRef.current++
        getOrCreatePromise(slug) // pre-seed promise before setWindows
        setWindows([...prev, newWindowEntry(slug, maxZ + 1, cascadeIndex)])
      }
    },
    [router],
  )

  const close = useCallback(
    (slug: string) => {
      // Evict the window's content promises so reopening refetches fresh data.
      // Preloaded shortcut windows re-seed their root slug from SSR data on the
      // next render (seedPromise in AdditionalWindow), so only navigated history
      // entries actually pay a refetch.
      const closing = windowsRef.current.find((w) => w.rootSlug === slug)
      if (closing) evictPromises(closing.historyStack)
      const next = windowsRef.current.filter((w) => w.rootSlug !== slug)
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
    setWindows(prev.map((w) => (w.rootSlug === slug ? { ...w, zIndex: maxZ + 1, minimized: false } : w)))
  }, [])

  const minimize = useCallback((slug: string) => {
    setWindows((prev) => prev.map((w) => (w.rootSlug === slug ? { ...w, pendingMinimize: true } : w)))
  }, [])

  const actualMinimize = useCallback((slug: string) => {
    setWindows((prev) => prev.map((w) => (w.rootSlug === slug ? { ...w, minimized: true, pendingMinimize: false } : w)))
  }, [])

  const navigateInWindow = useCallback((rootSlug: string, newSlug: string) => {
    getOrCreatePromise(newSlug) // pre-seed in event handler context
    setWindows((prev) =>
      prev.map((w) => {
        if (w.rootSlug !== rootSlug) return w
        const truncated = w.historyStack.slice(0, w.historyIndex + 1)
        const newStack = [...truncated, newSlug]
        return { ...w, slug: newSlug, historyStack: newStack, historyIndex: newStack.length - 1 }
      }),
    )
  }, [])

  const backInWindow = useCallback((rootSlug: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.rootSlug !== rootSlug) return w
        if (w.historyIndex <= 0) return w
        const newIndex = w.historyIndex - 1
        return { ...w, historyIndex: newIndex, slug: w.historyStack[newIndex] }
      }),
    )
  }, [])

  const forwardInWindow = useCallback((rootSlug: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.rootSlug !== rootSlug) return w
        if (w.historyIndex >= w.historyStack.length - 1) return w
        const newIndex = w.historyIndex + 1
        return { ...w, historyIndex: newIndex, slug: w.historyStack[newIndex] }
      }),
    )
  }, [])

  return {
    windows,
    primarySlug: realPrimarySlug,
    open,
    close,
    focus,
    minimize,
    actualMinimize,
    navigateInWindow,
    backInWindow,
    forwardInWindow,
  }
}
