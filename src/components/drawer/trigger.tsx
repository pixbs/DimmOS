'use client'

import { type ReactNode } from 'react'
import { useDrawer } from './context'

interface DrawerTriggerProps {
  children: ReactNode
  className?: string
}

export function DrawerTrigger({ children, className }: DrawerTriggerProps) {
  const { open } = useDrawer()
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  )
}
