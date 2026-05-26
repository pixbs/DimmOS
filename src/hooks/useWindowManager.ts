'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { parseOpenWindows, serializeOpenWindows } from '@/lib/window-state'

export interface ManagedWindow {
  slug: string
  zIndex: number
  minimized: boolean
}

export const BASE_Z = 50

export interface WindowManager {
  windows: ManagedWindow[]
  primarySlug: string | null
  open: (slug: string) => void
  close: (slug: string) => void
  focus: (slug: string) => void
  minimize: (slug: string) => void
}

export function useWindowManager(): WindowManager {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const primarySlug = pathname === '/' ? null : pathname.slice(1)

  const [windows, setWindows] = useState<ManagedWindow[]>(() => {
    const secondaries = parseOpenWindows(searchParams).filter((s) => s !== primarySlug)
    return [
      ...(primarySlug ? [{ slug: primarySlug, zIndex: BASE_Z, minimized: false }] : []),
      ...secondaries.map((slug, i) => ({ slug, zIndex: BASE_Z + 1 + i, minimized: false })),
    ]
  })

  const windowsRef = useRef(windows)
  windowsRef.current = windows

  const primarySlugRef = useRef(primarySlug)
  primarySlugRef.current = primarySlug

  // On real Next.js navigation: swap the primary entry, keep existing secondaries
  const prevPrimaryRef = useRef(primarySlug)
  useEffect(() => {
    if (prevPrimaryRef.current === primarySlug) return
    prevPrimaryRef.current = primarySlug
    setWindows((prev) => {
      const secondaries = prev.filter((w) => w.slug !== primarySlug)
      return [
        ...(primarySlug ? [{ slug: primarySlug, zIndex: BASE_Z, minimized: false }] : []),
        ...secondaries,
      ]
    })
  }, [primarySlug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Only updates ?open= search params — NEVER changes the pathname
  const syncUrl = useCallback((wins: ManagedWindow[]) => {
    const curPrimary = primarySlugRef.current
    const secondaries = wins.filter((w) => w.slug !== curPrimary).map((w) => w.slug)
    const openParam = serializeOpenWindows(secondaries)
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${openParam ? `?open=${openParam}` : ''}`,
    )
  }, [])

  const open = useCallback(
    (slug: string) => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        router.push(`/${slug}`)
        return
      }
      if (slug === primarySlugRef.current) {
        // Primary already open — bring it to front
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
        next = [...prev, { slug, zIndex: maxZ + 1, minimized: false }]
      }
      setWindows(next)
      syncUrl(next)
    },
    [syncUrl],
  )

  const close = useCallback(
    (slug: string) => {
      const next = windowsRef.current.filter((w) => w.slug !== slug)
      if (slug === primarySlugRef.current) {
        const openParam = serializeOpenWindows(next.map((w) => w.slug))
        router.push(openParam ? `/?open=${openParam}` : '/')
      } else {
        setWindows(next)
        syncUrl(next)
      }
    },
    [syncUrl, router],
  )

  const focus = useCallback((slug: string) => {
    const prev = windowsRef.current
    const maxZ = Math.max(...prev.map((w) => w.zIndex), BASE_Z - 1)
    // No URL change — changing pathname via history.replaceState triggers Next.js routing
    setWindows(prev.map((w) => (w.slug === slug ? { ...w, zIndex: maxZ + 1, minimized: false } : w)))
  }, [])

  const minimize = useCallback((slug: string) => {
    setWindows((prev) => prev.map((w) => (w.slug === slug ? { ...w, minimized: true } : w)))
  }, [])

  return { windows, primarySlug, open, close, focus, minimize }
}
