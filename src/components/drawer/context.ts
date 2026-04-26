'use client'

import { createContext, useContext } from 'react'

export type DrawerContextValue = { close: () => void; open: () => void }

export const DrawerContext = createContext<DrawerContextValue | null>(null)

export function useDrawer() {
  const ctx = useContext(DrawerContext)
  if (!ctx) throw new Error('useDrawer must be used within a drawer component')
  return ctx
}
