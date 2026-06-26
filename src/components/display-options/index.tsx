'use client'

import type { ReactNode } from 'react'
import { DisplayOptionsStateProvider, useDisplayOptions } from './context'

export function DisplayOptionsProvider({ children }: { children: ReactNode }) {
  return (
    <DisplayOptionsStateProvider>
      {children}
    </DisplayOptionsStateProvider>
  )
}

export { useDisplayOptions }
