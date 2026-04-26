import { type ReactNode } from 'react'
import PageDrawer from '@/components/drawer/page-drawer'

export default function PagesLayout({ children }: { children: ReactNode }) {
  return <PageDrawer>{children}</PageDrawer>
}
