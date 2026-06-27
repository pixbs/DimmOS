'use client'

import type { CSSProperties, ReactNode } from 'react'
import { WindowTitleBar } from '@/components/window/title-bar'
import { WindowToolbar } from '@/components/window/WindowToolbar'
import {
  WindowToolbarProvider,
  type ToolbarBehavior,
} from '@/components/window/window-toolbar-context'

const PREVIEW_STYLE = {
  '--win-h': '582px',
  '--win-w': '1120px',
  '--win-x': '40px',
  '--win-y': '24px',
  '--win-z': '1',
} as CSSProperties

export function SeoPreviewFrame({
  behavior,
  children,
  title,
}: {
  behavior: ToolbarBehavior
  children: ReactNode
  title: string
}) {
  const noop = () => {}

  return (
    <div
      data-window-panel=""
      data-seo-preview-window=""
      data-state="open"
      className="backdrop-blur-lg"
      style={PREVIEW_STYLE}
    >
      <WindowTitleBar
        title={title}
        onClose={noop}
        onMinimize={noop}
        onExpand={noop}
        onPointerDown={noop}
        disableMinimize={false}
        expandable={false}
      />
      <WindowToolbarProvider
        behavior={behavior}
        canGoBack={false}
        canGoForward={false}
        onBack={noop}
        onForward={noop}
        onNavigate={noop}
      >
        <WindowToolbar />
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      </WindowToolbarProvider>
    </div>
  )
}
