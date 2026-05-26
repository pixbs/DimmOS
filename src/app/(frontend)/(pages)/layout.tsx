import { type ReactNode } from 'react'
import PageDrawer from '@/components/drawer/page-drawer'
import { WindowTitleProvider } from '@/components/window/title-context'

export default function PagesLayout({ children }: { children: ReactNode }) {
  return (
    <WindowTitleProvider>
      <PageDrawer>{children}</PageDrawer>
    </WindowTitleProvider>
  )
}
