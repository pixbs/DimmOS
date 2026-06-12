// Shared localStorage persistence for window/drawer panel geometry.
// Storage shape: localStorage['window-positions'] = { [key]: { x, y, w, h } }

export type SavedPosition = { x?: number; y?: number; w?: number; h?: number }

const STORAGE_KEY = 'window-positions'

function warnDev(message: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(message, error)
  }
}

function readAll(): Record<string, SavedPosition> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, SavedPosition>
  } catch (error) {
    warnDev('window-positions: failed to parse stored positions', error)
    return {}
  }
}

export function loadSavedPosition(key: string): SavedPosition {
  return readAll()[key] ?? {}
}

export function mergePositionToStorage(key: string, updates: Partial<SavedPosition>): void {
  try {
    const all = readAll()
    all[key] = { ...all[key], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch (error) {
    // quota exceeded or private browsing — position simply isn't persisted
    warnDev('window-positions: failed to persist position', error)
  }
}

/** Read a px-suffixed CSS custom property off an element's inline style. */
export function parsePx(el: HTMLElement, prop: string, fallback: number): number {
  const raw = el.style.getPropertyValue(prop)
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
