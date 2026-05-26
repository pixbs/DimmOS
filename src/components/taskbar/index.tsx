'use client'

import { useWindowManagerContext } from '@/components/window/manager-context'

export function Taskbar() {
  const { windows, focus, minimize } = useWindowManagerContext()

  if (windows.length === 0) return null

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 items-center gap-2 px-3 py-2 rounded-xl border border-fg/10 bg-bg/90 backdrop-blur-md shadow-lg"
      data-taskbar=""
    >
      {windows.map((win) => (
        <button
          key={win.slug}
          onClick={() => (win.minimized ? focus(win.slug) : minimize(win.slug))}
          title={win.slug}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-fg/10 transition-colors"
          style={{ opacity: win.minimized ? 0.4 : 1 }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: win.minimized ? 'transparent' : 'var(--color-brand)',
              border: '1px solid var(--color-brand)',
            }}
          />
          <span className="max-w-24 truncate">{win.slug}</span>
        </button>
      ))}
    </div>
  )
}
