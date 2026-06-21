'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_DISPLAY_OPTIONS,
  loadDisplayOptions,
  saveDisplayOptions,
  type CursorMode,
  type DisplayOptions,
} from '@/lib/display-options'

interface DisplayOptionsContextValue {
  options: DisplayOptions
  cursorMode: CursorMode
  setCursorMode: (mode: CursorMode) => void
  isDisplayOptionsOpen: boolean
  openDisplayOptions: () => void
  closeDisplayOptions: () => void
}

const DisplayOptionsContext = createContext<DisplayOptionsContextValue>({
  options: DEFAULT_DISPLAY_OPTIONS,
  cursorMode: DEFAULT_DISPLAY_OPTIONS.cursorMode,
  setCursorMode: () => {},
  isDisplayOptionsOpen: false,
  openDisplayOptions: () => {},
  closeDisplayOptions: () => {},
})

function getInitialOptions(): DisplayOptions {
  if (typeof document === 'undefined') return DEFAULT_DISPLAY_OPTIONS
  const mode = document.documentElement.dataset.dimmCursor
  return mode === 'system' ? { cursorMode: 'system' } : DEFAULT_DISPLAY_OPTIONS
}

function applyCursorMode(mode: CursorMode): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.dimmCursor = mode
}

export function DisplayOptionsStateProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<DisplayOptions>(getInitialOptions)
  const [isDisplayOptionsOpen, setIsDisplayOptionsOpen] = useState(false)

  useEffect(() => {
    const stored = loadDisplayOptions()
    setOptions(stored)
    applyCursorMode(stored.cursorMode)
  }, [])

  useEffect(() => {
    function onOpen() {
      setIsDisplayOptionsOpen(true)
    }
    window.addEventListener('dimmos:open-display-options', onOpen)
    document.documentElement.dataset.displayOptionsReady = 'true'
    return () => {
      window.removeEventListener('dimmos:open-display-options', onOpen)
      delete document.documentElement.dataset.displayOptionsReady
    }
  }, [])

  const setCursorMode = useCallback((cursorMode: CursorMode) => {
    setOptions((prev) => {
      const next = { ...prev, cursorMode }
      saveDisplayOptions(next)
      applyCursorMode(cursorMode)
      return next
    })
  }, [])

  const value = useMemo<DisplayOptionsContextValue>(
    () => ({
      options,
      cursorMode: options.cursorMode,
      setCursorMode,
      isDisplayOptionsOpen,
      openDisplayOptions: () => setIsDisplayOptionsOpen(true),
      closeDisplayOptions: () => setIsDisplayOptionsOpen(false),
    }),
    [isDisplayOptionsOpen, options, setCursorMode],
  )

  return (
    <DisplayOptionsContext.Provider value={value}>
      {children}
    </DisplayOptionsContext.Provider>
  )
}

export function useDisplayOptions() {
  return useContext(DisplayOptionsContext)
}
