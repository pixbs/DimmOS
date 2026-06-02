'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { WindowManager } from '@/hooks/useWindowManager'

const noop = () => {}

const WindowManagerContext = createContext<WindowManager>({
  windows: [],
  primarySlug: null,
  open: noop,
  close: noop,
  focus: noop,
  minimize: noop,
  actualMinimize: noop,
})

export function WindowManagerContextProvider({
  manager,
  children,
}: {
  manager: WindowManager
  children: ReactNode
}) {
  return (
    <WindowManagerContext.Provider value={manager}>
      {children}
    </WindowManagerContext.Provider>
  )
}

export function useWindowManagerContext(): WindowManager {
  return useContext(WindowManagerContext)
}
