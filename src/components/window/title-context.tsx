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
  // Toolbar capability flags (set from the page via SetWindowToolbar)
  displaySearch: boolean
  setDisplaySearch: (v: boolean) => void
  displayViewToggle: boolean
  setDisplayViewToggle: (v: boolean) => void
  defaultView: 'grid' | 'table'
  setDefaultView: (v: 'grid' | 'table') => void
  displayHistory: boolean
  setDisplayHistory: (v: boolean) => void
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
  displaySearch: false,
  setDisplaySearch: () => {},
  displayViewToggle: false,
  setDisplayViewToggle: () => {},
  defaultView: 'grid',
  setDefaultView: () => {},
  displayHistory: false,
  setDisplayHistory: () => {},
})

export function WindowTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('')
  const [disableMinimize, setDisableMinimize] = useState(false)
  const [resizable, setResizable] = useState(true)
  const [expandable, setExpandable] = useState(false)
  const [displaySearch, setDisplaySearch] = useState(false)
  const [displayViewToggle, setDisplayViewToggle] = useState(false)
  const [defaultView, setDefaultView] = useState<'grid' | 'table'>('grid')
  const [displayHistory, setDisplayHistory] = useState(false)
  return (
    <WindowTitleContext.Provider value={{
      title, setTitle,
      disableMinimize, setDisableMinimize,
      resizable, setResizable,
      expandable, setExpandable,
      displaySearch, setDisplaySearch,
      displayViewToggle, setDisplayViewToggle,
      defaultView, setDefaultView,
      displayHistory, setDisplayHistory,
    }}>
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

/** Drop inside any page to configure the window toolbar (search, view toggle, history). */
export function SetWindowToolbar({
  displaySearch = false,
  displayViewToggle = false,
  defaultView = 'grid' as 'grid' | 'table',
  displayHistory = false,
}: {
  displaySearch?: boolean
  displayViewToggle?: boolean
  defaultView?: 'grid' | 'table'
  displayHistory?: boolean
}) {
  const { setDisplaySearch, setDisplayViewToggle, setDefaultView, setDisplayHistory } = useWindowTitle()
  useEffect(() => {
    setDisplaySearch(displaySearch)
    setDisplayViewToggle(displayViewToggle)
    setDefaultView(defaultView)
    setDisplayHistory(displayHistory)
    return () => {
      setDisplaySearch(false)
      setDisplayViewToggle(false)
      setDefaultView('grid')
      setDisplayHistory(false)
    }
  }, [displaySearch, displayViewToggle, defaultView, displayHistory, setDisplaySearch, setDisplayViewToggle, setDefaultView, setDisplayHistory])
  return null
}
