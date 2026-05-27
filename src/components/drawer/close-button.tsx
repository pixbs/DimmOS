'use client'

import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { useDrawer } from './context'

interface DrawerCloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
}

export function DrawerCloseButton({ children, className, ...rest }: DrawerCloseButtonProps) {
  const { close } = useDrawer()
  return (
    <button type="button" onClick={close} className={className} {...rest}>
      {children}
    </button>
  )
}
