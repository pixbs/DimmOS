'use client'

import { useWindowManagerContext } from '@/components/window/manager-context'
import { isDesktopViewport } from '@/lib/breakpoints'
import { Shortcut } from './index'

interface ShortcutData {
  icon: string
  name: string
  href: string
  slug: string
  color: string
}

export function ShortcutGrid({ shortcuts }: { shortcuts: ShortcutData[] }) {
  const manager = useWindowManagerContext()

  return (
    <>
      {shortcuts.map((s, i) => (
        <Shortcut
          key={i}
          icon={s.icon}
          name={s.name}
          href={s.href}
          color={s.color}
          onClick={(e) => {
            if (isDesktopViewport()) {
              e.preventDefault()
              manager.open(s.slug)
            }
          }}
        />
      ))}
    </>
  )
}
