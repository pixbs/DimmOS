'use client'

import type { ReactNode } from 'react'
import { DisplayOptionsStateProvider, useDisplayOptions } from './context'
import { DisplayOptionsWindow } from './window'

export function DisplayOptionsProvider({ children }: { children: ReactNode }) {
  return (
    <DisplayOptionsStateProvider>
      {children}
      <DisplayOptionsWindow />
    </DisplayOptionsStateProvider>
  )
}

export { useDisplayOptions }
