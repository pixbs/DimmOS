'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'

export interface ShortcutMeta {
  icon: string
  name: string
  color: string
  category: 'windows' | 'articles' | 'forms'
}

const RegistryContext = createContext<Map<string, ShortcutMeta>>(new Map())

export function ShortcutRegistryProvider({
  shortcuts,
  children,
}: {
  shortcuts: (ShortcutMeta & { slug: string })[]
  children: ReactNode
}) {
  const map = useMemo(
    () => new Map(shortcuts.map((s) => [s.slug, s])),
    [shortcuts],
  )
  return <RegistryContext.Provider value={map}>{children}</RegistryContext.Provider>
}

export function useShortcutRegistry() {
  return useContext(RegistryContext)
}
