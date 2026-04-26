import { type ReactNode } from 'react'
import { DrawerShell } from './shell'

interface DrawerProps {
  children: ReactNode
  autoOpen?: boolean
  trigger?: ReactNode
}

export default function Drawer({ children, autoOpen, trigger }: DrawerProps) {
  return <DrawerShell autoOpen={autoOpen} trigger={trigger}>{children}</DrawerShell>
}
