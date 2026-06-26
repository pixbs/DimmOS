'use client'

import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import { useWindowManagerContext } from '@/components/window/manager-context'
import { useShortcutRegistry } from '@/components/shortcut/registry-context'

const CATEGORY_ORDER = ['windows', 'articles', 'forms'] as const
const SYSTEM_META = {
  'cookie-notice': { icon: 'ri-shield-check-fill', color: '#F22F57', name: 'Cookie Notice' },
  'cookie-preferences': { icon: 'ri-shield-keyhole-fill', color: '#F22F57', name: 'Cookie Preferences' },
  'display-options': { icon: 'ri-settings-3-fill', color: '#4A9EFF', name: 'Display Options' },
} as const

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

function TaskbarButton({
  win,
  icon,
  color,
  name,
  onFocus,
  onMinimize,
}: {
  win: { rootSlug: string; minimized: boolean }
  icon: string
  color: string
  name: string
  onFocus: () => void
  onMinimize: () => void
}) {
  return (
    <div className="group relative">
      <button
        data-window-id={win.rootSlug}
        data-taskbar-window={win.rootSlug}
        data-taskbar-minimized={win.minimized ? 'true' : 'false'}
        onClick={() => (win.minimized ? onFocus() : onMinimize())}
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
      <span className="pointer-events-none absolute bottom-[110%] left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg px-2 py-1 text-xs text-fg bg-bgs opacity-0 group-hover:opacity-100 transition-opacity border-0">
        {name}
      </span>
    </div>
  )
}

export function Taskbar() {
  const { windows, focus, minimize } = useWindowManagerContext()
  const registry = useShortcutRegistry()

  const openWindows = windows
  if (openWindows.length === 0) return null

  const maxZ = Math.max(50, ...openWindows.map((w) => w.zIndex))
  const contentWindows = openWindows.filter((w) => w.kind === 'content')
  const systemWindows = openWindows.filter((w) => w.kind === 'system' && w.systemKey && w.systemKey !== 'cookie-notice')

  // Windows not in the CMS registry (e.g. a 404'd slug)
  const orphanWindows = contentWindows.filter((w) => {
    const meta = registry.get(w.rootSlug) ?? registry.get(w.slug)
    return !meta
  })

  // Group registered windows by CMS category
  const groups = CATEGORY_ORDER
    .map((cat) => contentWindows.filter((w) => {
      const meta = registry.get(w.rootSlug) ?? registry.get(w.slug)
      return meta?.category === cat
    }))
    .filter((g) => g.length > 0)

  const hasRegular = groups.length > 0
  const hasOrphan = orphanWindows.length > 0
  const hasSystem = systemWindows.length > 0

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
            const meta = registry.get(win.slug) ?? registry.get(win.rootSlug)
            const icon  = meta?.icon  ?? FALLBACK_ICONS[meta?.category ?? '']  ?? 'ri-window-fill'
            const color = meta?.color ?? FALLBACK_COLORS[meta?.category ?? ''] ?? '#4A9EFF'
            const name  = meta?.name  ?? win.slug
            return (
              <TaskbarButton
                key={win.rootSlug}
                win={win}
                icon={icon}
                color={color}
                name={name}
                onFocus={() => focus(win.rootSlug)}
                onMinimize={() => minimize(win.rootSlug)}
              />
            )
          })}
        </Fragment>
      ))}

      {/* Separator before unregistered windows */}
      {hasRegular && hasOrphan && (
        <div
          className="w-px h-8 self-center"
          style={{ background: 'color-mix(in srgb, white 15%, transparent)' }}
        />
      )}

      {/* Unregistered windows — shown as error (e.g. 404'd route) */}
      {orphanWindows.map((win) => (
        <TaskbarButton
          key={win.rootSlug}
          win={win}
          icon="ri-error-warning-fill"
          color="#F22F57"
          name={win.rootSlug}
          onFocus={() => focus(win.rootSlug)}
          onMinimize={() => minimize(win.rootSlug)}
        />
      ))}

      {(hasRegular || hasOrphan) && hasSystem && (
        <div
          className="w-px h-8 self-center"
          style={{ background: 'color-mix(in srgb, white 15%, transparent)' }}
        />
      )}

      {systemWindows.map((win) => {
        const meta = win.systemKey ? SYSTEM_META[win.systemKey] : null
        return (
          <TaskbarButton
            key={win.id}
            win={{ rootSlug: win.id, minimized: win.minimized }}
            icon={meta?.icon ?? 'ri-window-fill'}
            color={meta?.color ?? '#4A9EFF'}
            name={meta?.name ?? win.id}
            onFocus={() => focus(win.id)}
            onMinimize={() => minimize(win.id)}
          />
        )
      })}
    </div>
  )
}
