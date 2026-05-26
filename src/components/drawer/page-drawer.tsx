import { type ReactNode } from 'react'
import { PageDrawerShell } from './page-shell'

interface PageDrawerProps {
  children: ReactNode
  title?: string
}

export default function PageDrawer({ children, title }: PageDrawerProps) {
  return <PageDrawerShell title={title}>{children}</PageDrawerShell>
}
