'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { WindowBehaviorConfig } from '@/utilities/windowBehavior'

export type ToolbarBehavior = Pick<
  WindowBehaviorConfig,
  'displaySearch' | 'displayViewToggle' | 'defaultView' | 'displayHistory'
>

interface WindowToolbarContextValue {
  behavior: ToolbarBehavior
  searchQuery: string
  setSearchQuery: (q: string) => void
  viewMode: 'grid' | 'table'
  setViewMode: (m: 'grid' | 'table') => void
  canGoBack: boolean
  canGoForward: boolean
  back: () => void
  forward: () => void
  navigate: (slug: string) => void
}

const DEFAULT_BEHAVIOR: ToolbarBehavior = {
  displaySearch: false,
  displayViewToggle: false,
  defaultView: 'grid',
  displayHistory: false,
}

const WindowToolbarContext = createContext<WindowToolbarContextValue>({
  behavior: DEFAULT_BEHAVIOR,
  searchQuery: '',
  setSearchQuery: () => {},
  viewMode: 'grid',
  setViewMode: () => {},
  canGoBack: false,
  canGoForward: false,
  back: () => {},
  forward: () => {},
  navigate: () => {},
})

interface WindowToolbarProviderProps {
  children: ReactNode
  behavior: ToolbarBehavior
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  onNavigate: (slug: string) => void
}

export function WindowToolbarProvider({
  children,
  behavior,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onNavigate,
}: WindowToolbarProviderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  // null = follow behavior.defaultView; explicit value = user has toggled
  const [userViewMode, setUserViewMode] = useState<'grid' | 'table' | null>(null)
  const viewMode = userViewMode ?? behavior.defaultView

  return (
    <WindowToolbarContext.Provider
      value={{
        behavior,
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode: setUserViewMode,
        canGoBack,
        canGoForward,
        back: onBack,
        forward: onForward,
        navigate: onNavigate,
      }}
    >
      {children}
    </WindowToolbarContext.Provider>
  )
}

export function useWindowToolbar() {
  return useContext(WindowToolbarContext)
}
