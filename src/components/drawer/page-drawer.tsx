import { type ReactNode } from 'react'
import { PageDrawerShell } from './page-shell'

export default function PageDrawer({ children }: { children: ReactNode }) {
  return <PageDrawerShell>{children}</PageDrawerShell>
}
