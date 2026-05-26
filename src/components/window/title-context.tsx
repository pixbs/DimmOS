'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface WindowTitleContextValue {
  title: string
  setTitle: (title: string) => void
}

const WindowTitleContext = createContext<WindowTitleContextValue>({
  title: '',
  setTitle: () => {},
})

export function WindowTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('')
  return (
    <WindowTitleContext.Provider value={{ title, setTitle }}>
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
