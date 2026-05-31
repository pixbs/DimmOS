'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface WindowTitleContextValue {
  title: string
  setTitle: (title: string) => void
  disableMinimize: boolean
  setDisableMinimize: (v: boolean) => void
  resizable: boolean
  setResizable: (v: boolean) => void
  expandable: boolean
  setExpandable: (v: boolean) => void
}

const WindowTitleContext = createContext<WindowTitleContextValue>({
  title: '',
  setTitle: () => {},
  disableMinimize: false,
  setDisableMinimize: () => {},
  resizable: true,
  setResizable: () => {},
  expandable: false,
  setExpandable: () => {},
})

export function WindowTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('')
  const [disableMinimize, setDisableMinimize] = useState(false)
  const [resizable, setResizable] = useState(true)
  const [expandable, setExpandable] = useState(false)
  return (
    <WindowTitleContext.Provider value={{ title, setTitle, disableMinimize, setDisableMinimize, resizable, setResizable, expandable, setExpandable }}>
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
export function SetWindowOptions({
  disableMinimize = false,
  resizable = true,
  expandable = false,
}: {
  disableMinimize?: boolean
  resizable?: boolean
  expandable?: boolean
}) {
  const { setDisableMinimize, setResizable, setExpandable } = useWindowTitle()
  useEffect(() => {
    setDisableMinimize(disableMinimize)
    setResizable(resizable)
    setExpandable(expandable)
    return () => {
      setDisableMinimize(false)
      setResizable(true)
      setExpandable(false)
    }
  }, [disableMinimize, resizable, expandable, setDisableMinimize, setResizable, setExpandable])
  return null
}
