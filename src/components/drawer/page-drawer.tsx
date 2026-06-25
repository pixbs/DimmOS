'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { PageDrawerShell } from './page-shell'

interface PageDrawerProps {
  children: ReactNode
  title?: string
}

export default function PageDrawer({ children, title }: PageDrawerProps) {
  const pathname = usePathname()
  if (pathname === '/cookie-preferences') return <>{children}</>

  return <PageDrawerShell title={title}>{children}</PageDrawerShell>
}
