'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface PreloaderContextValue {
  percentage: number
  isComplete: boolean
  reportReady: () => void
}

const PreloaderContext = createContext<PreloaderContextValue>({
  percentage: 100,
  isComplete: true,
  reportReady: () => {},
})

export function PreloaderProvider({ total, children }: { total: number | null; children: ReactNode }) {
  const [readyCount, setReadyCount] = useState(0)

  const reportReady = useCallback(() => {
    setReadyCount((n) => n + 1)
  }, [])

  const percentage = total === null ? 0 : total === 0 ? 100 : Math.round((readyCount / total) * 100)
  const isComplete = total !== null && percentage >= 100

  return (
    <PreloaderContext.Provider value={{ percentage, isComplete, reportReady }}>
      {children}
    </PreloaderContext.Provider>
  )
}

export function usePreloader() {
  return useContext(PreloaderContext)
}
