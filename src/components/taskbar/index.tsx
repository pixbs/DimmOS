'use client'

import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import { useWindowManagerContext } from '@/components/window/manager-context'
import { useShortcutRegistry } from '@/components/shortcut/registry-context'

const CATEGORY_ORDER = ['windows', 'articles', 'forms'] as const

const FALLBACK_ICONS: Record<string, string> = {
  windows:  'ri-window-fill',
  articles: 'ri-folder-fill',
  forms:    'ri-draft-fill',
}

const FALLBACK_COLORS: Record<string, string> = {
  windows:  '#4A9EFF',
  articles: '#F5A623',
  forms:    '#E3465A',
}

export function Taskbar() {
  const { windows, focus, minimize } = useWindowManagerContext()
  const registry = useShortcutRegistry()

  const openWindows = windows
  if (openWindows.length === 0) return null

  const maxZ = Math.max(50, ...openWindows.map((w) => w.zIndex))

  // Group by rootSlug's category (stable identity); fall back to slug's category for unregistered rootSlugs.
  // Using rootSlug ensures a navigated window stays in its original group, not the article's group.
  const groups = CATEGORY_ORDER
    .map((cat) => openWindows.filter((w) => {
      const meta = registry.get(w.rootSlug) ?? registry.get(w.slug)
      return meta?.category === cat
    }))
    .filter((g) => g.length > 0)

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-3xl bg-bgs/50 backdrop-blur-lg"
      style={{ border: '1.5px solid color-mix(in srgb, white 12%, transparent)', zIndex: maxZ + 1 }}
      data-taskbar=""
    >
      {groups.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 && (
            <div
              className="w-px h-8 self-center"
              style={{ background: 'color-mix(in srgb, white 15%, transparent)' }}
            />
          )}
          {group.map((win) => {
            // Use current content slug for icon/name; fall back to rootSlug if no registry entry
            const meta = registry.get(win.slug) ?? registry.get(win.rootSlug)
            const icon  = meta?.icon  ?? FALLBACK_ICONS[meta?.category ?? '']  ?? 'ri-window-fill'
            const color = meta?.color ?? FALLBACK_COLORS[meta?.category ?? ''] ?? '#4A9EFF'
            const name  = meta?.name  ?? win.slug

            return (
              <div key={win.rootSlug} className="group relative">
                <button
                  data-window-id={win.rootSlug}
                  onClick={() => (win.minimized ? focus(win.rootSlug) : minimize(win.rootSlug))}
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-opacity active:opacity-70',
                    win.minimized && 'opacity-40',
                  )}
                  style={{
                    background: `color-mix(in srgb, ${color} 10%, transparent)`,
                    color,
                  }}
                  aria-label={name}
                >
                  <i className={`${icon} text-2xl leading-none`} />
                </button>
                <span
                  className="pointer-events-none absolute bottom-[110%] left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg px-2 py-1 text-xs text-fg bg-bgs opacity-0 group-hover:opacity-100 transition-opacity border-0"
                >
                  {name}
                </span>
              </div>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}
