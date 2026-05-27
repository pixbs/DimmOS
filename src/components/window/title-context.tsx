'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface WindowTitleContextValue {
  title: string
  setTitle: (title: string) => void
  disableMinimize: boolean
  setDisableMinimize: (v: boolean) => void
}

const WindowTitleContext = createContext<WindowTitleContextValue>({
  title: '',
  setTitle: () => {},
  disableMinimize: false,
  setDisableMinimize: () => {},
})

export function WindowTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('')
  const [disableMinimize, setDisableMinimize] = useState(false)
  return (
    <WindowTitleContext.Provider value={{ title, setTitle, disableMinimize, setDisableMinimize }}>
      {children}
    </WindowTitleContext.Provider>
  )
}

export function useWindowTitle() {
  return useContext(WindowTitleContext)
}

/** Drop inside any page (Server or Client) to set the window title on desktop. */
export function SetWindowTitle({ title }: { title: string }) {
  const { setTitle } = useWindowTitle()
  useEffect(() => {
    setTitle(title)
    return () => setTitle('')
  }, [title, setTitle])
  return null
}

/** Drop inside any page to configure window chrome options. */
export function SetWindowOptions({ disableMinimize = false }: { disableMinimize?: boolean }) {
  const { setDisableMinimize } = useWindowTitle()
  useEffect(() => {
    setDisableMinimize(disableMinimize)
    return () => setDisableMinimize(false)
  }, [disableMinimize, setDisableMinimize])
  return null
}
