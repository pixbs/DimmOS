'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { isDesktopViewport } from '@/lib/breakpoints'
import { clearShortcutPositions } from '@/lib/shortcut-positions'
import { classifyHref, copyText, getSlugFromHref, toAbsoluteUrl } from '@/lib/context-menu'
import { useWindowManagerContext } from '@/components/window/manager-context'
import { useDisplayOptions } from '@/components/display-options'
import { EASE_OUT_QUAD } from '@/lib/easing'

type MenuItem = {
  label: string
  icon: string
  action: () => void | Promise<void>
  disabled?: boolean
}

type MenuState = {
  x: number
  y: number
  label: string
  items: MenuItem[]
}

const MENU_WIDTH = 240
const MENU_ITEM_HEIGHT = 38
const MENU_PADDING = 12

function menuHeight(items: MenuItem[]): number {
  return items.length * MENU_ITEM_HEIGHT + MENU_PADDING
}

function getPanelButton(panel: HTMLElement, labels: string[]): HTMLButtonElement | null {
  for (const label of labels) {
    const button = panel.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
    if (button) return button
  }
  return null
}

function clickPanelButton(panel: HTMLElement, labels: string[]): void {
  getPanelButton(panel, labels)?.click()
}

function getMenuPoint(x: number, y: number, items: MenuItem[]) {
  return {
    x: Math.min(x, Math.max(8, window.innerWidth - MENU_WIDTH - 8)),
    y: Math.min(y, Math.max(8, window.innerHeight - menuHeight(items) - 8)),
  }
}

function currentUrlForSlug(slug: string): string {
  return toAbsoluteUrl(`/${slug}`, window.location.origin)
}

export function DesktopContextMenu() {
  const manager = useWindowManagerContext()
  const { openDisplayOptions, closeDisplayOptions } = useDisplayOptions()
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!menu) return
    const first = menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')
    first?.focus()

    function onPointerDown(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return
      setMenu(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menu])

  useEffect(() => {
    function openAt(e: MouseEvent, label: string, items: MenuItem[]) {
      if (!items.length) return
      e.preventDefault()
      const point = getMenuPoint(e.clientX, e.clientY, items)
      setMenu({ ...point, label, items })
    }

    function onContextMenu(e: MouseEvent) {
      if (!isDesktopViewport()) return
      const target = e.target
      if (!(target instanceof Element)) return

      const shortcut = target.closest<HTMLElement>('[data-shortcut-slug]')
      if (shortcut && shortcut.closest('[data-shortcut-surface]')) {
        const slug = shortcut.dataset.shortcutSlug
        if (!slug) return
        const url = currentUrlForSlug(slug)
        openAt(e, 'Shortcut menu', [
          { label: 'Open in new DimmOS window', icon: 'ri-window-line', action: () => manager.open(slug) },
          { label: 'Open in new browser tab', icon: 'ri-external-link-line', action: () => window.open(url, '_blank', 'noopener,noreferrer') },
          { label: 'Copy link address', icon: 'ri-file-copy-line', action: () => copyText(url) },
        ])
        return
      }

      const taskbarButton = target.closest<HTMLElement>('[data-taskbar-window]')
      if (taskbarButton) {
        const rootSlug = taskbarButton.dataset.taskbarWindow
        if (!rootSlug) return
        const win = manager.windows.find((w) => w.rootSlug === rootSlug)
        if (!win) return
        const currentSlug = win.slug
        const url = currentUrlForSlug(currentSlug)
        openAt(e, 'Taskbar menu', [
          win.minimized
            ? { label: 'Restore', icon: 'ri-window-line', action: () => manager.focus(rootSlug) }
            : { label: 'Collapse', icon: 'ri-subtract-line', action: () => manager.minimize(rootSlug) },
          { label: 'Open in new browser tab', icon: 'ri-external-link-line', action: () => window.open(url, '_blank', 'noopener,noreferrer') },
          { label: 'Copy link address', icon: 'ri-file-copy-line', action: () => copyText(url) },
          { label: 'Close', icon: 'ri-close-line', action: () => manager.close(rootSlug) },
        ])
        return
      }

      const link = target.closest<HTMLAnchorElement>('a[href]')
      const linkPanel = link?.closest<HTMLElement>('[data-window-panel]')
      if (link && linkPanel) {
        const href = link.getAttribute('href')
        if (!href) return
        const url = toAbsoluteUrl(href, window.location.origin)
        const slug = getSlugFromHref(href)
        const kind = classifyHref(href)
        openAt(e, 'Link menu', [
          {
            label: 'Open',
            icon: kind === 'internal' ? 'ri-arrow-right-line' : 'ri-external-link-line',
            action: () => {
              if (slug) manager.open(slug)
              else link.click()
            },
          },
          { label: 'Open in new browser tab', icon: 'ri-external-link-line', action: () => window.open(url, '_blank', 'noopener,noreferrer') },
          { label: 'Copy link address', icon: 'ri-file-copy-line', action: () => copyText(url) },
        ])
        return
      }

      const panel = target.closest<HTMLElement>('[data-window-panel]')
      if (panel) {
        const isDisplayOptions = panel.hasAttribute('data-display-options-window')
        const isCookieBanner = panel.hasAttribute('data-cookie-banner')
        const items: MenuItem[] = []
        const minimize = getPanelButton(panel, ['Minimize'])
        const expand = getPanelButton(panel, ['Expand to full screen', 'Restore window'])
        const grid = getPanelButton(panel, ['Grid view'])
        const table = getPanelButton(panel, ['Table view'])

        if (minimize && !minimize.disabled) {
          items.push({ label: 'Collapse', icon: 'ri-subtract-line', action: () => minimize.click() })
        }
        if (expand && !expand.disabled) {
          items.push({
            label: expand.getAttribute('aria-label') === 'Restore window' ? 'Restore window' : 'Expand',
            icon: 'ri-expand-diagonal-line',
            action: () => expand.click(),
          })
        }
        if (grid && table) {
          items.push({ label: 'View grid', icon: 'ri-layout-grid-line', action: () => grid.click(), disabled: grid.getAttribute('aria-pressed') === 'true' })
          items.push({ label: 'View table', icon: 'ri-table-view', action: () => table.click(), disabled: table.getAttribute('aria-pressed') === 'true' })
        }
        items.push({
          label: 'Close',
          icon: 'ri-close-line',
          action: () => {
            if (isDisplayOptions) closeDisplayOptions()
            else if (isCookieBanner) window.dispatchEvent(new Event('dimmos:close-cookie-banner'))
            else clickPanelButton(panel, ['Close', 'Close display options', 'Close cookie notice'])
          },
        })
        openAt(e, 'Window menu', items)
        return
      }

      if (target.closest('[data-shortcut-surface], main')) {
        openAt(e, 'Wallpaper menu', [
          { label: 'About DimmOS', icon: 'ri-information-line', action: () => manager.open('about') },
          { label: 'Display options', icon: 'ri-settings-3-line', action: openDisplayOptions },
          {
            label: 'Reset icons',
            icon: 'ri-refresh-line',
            action: () => {
              clearShortcutPositions()
              window.dispatchEvent(new Event('dimmos:reset-shortcut-positions'))
            },
          },
        ])
      }
    }

    document.addEventListener('contextmenu', onContextMenu)
    return () => document.removeEventListener('contextmenu', onContextMenu)
  }, [closeDisplayOptions, manager, openDisplayOptions])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {menu && (
        <motion.div
          key={`${menu.label}-${menu.x}-${menu.y}`}
          ref={menuRef}
          role="menu"
          aria-label={menu.label}
          data-context-menu=""
          className="fixed z-10000 flex w-60 origin-top-left flex-col overflow-hidden rounded-2xl border border-fg/10 bg-bgs/80 p-1.5 text-sm text-fg shadow-2xl backdrop-blur-xl pointer-events-auto"
          style={{ left: menu.x, top: menu.y }}
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -2 }}
          transition={{ duration: 0.16, ease: EASE_OUT_QUAD }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              setMenu(null)
            }
          }}
        >
          {menu.items.map((item) => (
            <motion.button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              data-cursor-action={item.disabled ? undefined : 'action'}
              whileHover={item.disabled ? undefined : { x: 2, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
              whileTap={item.disabled ? undefined : { scale: 0.985 }}
              transition={{ duration: 0.12, ease: EASE_OUT_QUAD }}
              onClick={async () => {
                await item.action()
                setMenu(null)
              }}
              className="group flex h-[38px] cursor-pointer items-center gap-3 rounded-md px-3 text-left text-fg transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:cursor-default disabled:opacity-40"
            >
              <i className={`${item.icon} text-base text-fg/60 transition-colors group-hover:text-fg/90 group-focus:text-fg/90`} />
              <span>{item.label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
