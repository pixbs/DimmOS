'use client'

import { type ReactNode } from 'react'
import { useDrawer } from './context'

interface DrawerCloseButtonProps {
  children: ReactNode
  className?: string
}

export function DrawerCloseButton({ children, className }: DrawerCloseButtonProps) {
  const { close } = useDrawer()
  return (
    <button type="button" onClick={close} className={className}>
      {children}
    </button>
  )
}
