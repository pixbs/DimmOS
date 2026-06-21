import { clamp } from './window-positions'

export type ShortcutPosition = { x: number; y: number }

export type ShortcutPositions = Record<string, ShortcutPosition>

export const SHORTCUT_POSITIONS_STORAGE_KEY = 'shortcut-positions:v1'

export type ShortcutLayout = {
  surfaceWidth: number
  surfaceHeight: number
  tile: number
  shortcutWidth: number
  shortcutHeight: number
}

function warnDev(message: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(message, error)
  }
}

function isPosition(value: unknown): value is ShortcutPosition {
  if (!value || typeof value !== 'object') return false
  const raw = value as { x?: unknown; y?: unknown }
  return typeof raw.x === 'number' && Number.isFinite(raw.x) && typeof raw.y === 'number' && Number.isFinite(raw.y)
}

export function getShortcutCols(surfaceWidth: number): number {
  if (surfaceWidth >= 1280) return 20
  if (surfaceWidth >= 768) return 12
  return 6
}

export function getShortcutLayout(surfaceWidth: number, surfaceHeight: number): ShortcutLayout {
  const cols = getShortcutCols(surfaceWidth)
  const tile = surfaceWidth / cols
  return {
    surfaceWidth,
    surfaceHeight,
    tile,
    shortcutWidth: tile * 2,
    shortcutHeight: tile * 2,
  }
}

export function getDefaultShortcutPosition(index: number, layout: ShortcutLayout): ShortcutPosition {
  const slotsPerRow = Math.max(1, Math.floor(layout.surfaceWidth / layout.shortcutWidth))
  return clampShortcutPosition(
    {
      x: (index % slotsPerRow) * layout.shortcutWidth,
      y: Math.floor(index / slotsPerRow) * layout.shortcutHeight,
    },
    layout,
  )
}

export function clampShortcutPosition(pos: ShortcutPosition, layout: ShortcutLayout): ShortcutPosition {
  return {
    x: clamp(pos.x, 0, Math.max(0, layout.surfaceWidth - layout.shortcutWidth)),
    y: clamp(pos.y, 0, Math.max(0, layout.surfaceHeight - layout.shortcutHeight)),
  }
}

export function parseShortcutPositions(value: unknown): ShortcutPositions {
  if (!value || typeof value !== 'object') return {}
  const parsed: ShortcutPositions = {}
  for (const [slug, pos] of Object.entries(value)) {
    if (isPosition(pos)) parsed[slug] = pos
  }
  return parsed
}

export function loadShortcutPositions(): ShortcutPositions {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(SHORTCUT_POSITIONS_STORAGE_KEY)
    if (!raw) return {}
    return parseShortcutPositions(JSON.parse(raw))
  } catch (error) {
    warnDev('shortcut-positions: failed to parse stored positions', error)
    return {}
  }
}

export function saveShortcutPosition(slug: string, position: ShortcutPosition): ShortcutPositions {
  const next = { ...loadShortcutPositions(), [slug]: position }
  if (typeof localStorage === 'undefined') return next
  try {
    localStorage.setItem(SHORTCUT_POSITIONS_STORAGE_KEY, JSON.stringify(next))
  } catch (error) {
    warnDev('shortcut-positions: failed to persist position', error)
  }
  return next
}

export function clearShortcutPositions(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(SHORTCUT_POSITIONS_STORAGE_KEY)
  } catch (error) {
    warnDev('shortcut-positions: failed to clear positions', error)
  }
}
