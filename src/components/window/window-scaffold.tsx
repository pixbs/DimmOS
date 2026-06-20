// Standard window content layout: a scrolling body with an optional footer
// pinned to the bottom of the panel (outside the scroll flow). Used by both
// render paths — server pages (WindowContent/ArticleContent) and the client
// ContentView — so action buttons sit below the scroll area, not inside it.
import type { ReactNode } from 'react'
import { ScrollRoot } from '@/components/animation/scroll-root-context'

export function WindowScaffold({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full gap-2">
      {/* Dark content box — the only scrolling region. ScrollRoot exposes it to
          section animations so they observe true visibility inside the window. */}
      <ScrollRoot className="win-scroll flex-1 overflow-auto min-h-0 bg-bg rounded-2xl">
        {children}
      </ScrollRoot>
      {/* Footer sits on the panel rim, outside the content box */}
      {footer ? (
        <div
          data-window-footer=""
          className="shrink-0 flex flex-col gap-2 pb-[env(safe-area-inset-bottom)]"
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
