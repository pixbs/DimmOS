export type CursorMode = 'website' | 'system'

export type DisplayOptions = {
  cursorMode: CursorMode
}

export const DISPLAY_OPTIONS_STORAGE_KEY = 'display-options:v1'

export const DEFAULT_DISPLAY_OPTIONS: DisplayOptions = {
  cursorMode: 'website',
}

function warnDev(message: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(message, error)
  }
}

function isCursorMode(value: unknown): value is CursorMode {
  return value === 'website' || value === 'system'
}

export function parseDisplayOptions(value: unknown): DisplayOptions {
  if (!value || typeof value !== 'object') return DEFAULT_DISPLAY_OPTIONS
  const raw = value as { cursorMode?: unknown }
  return {
    cursorMode: isCursorMode(raw.cursorMode) ? raw.cursorMode : DEFAULT_DISPLAY_OPTIONS.cursorMode,
  }
}

export function loadDisplayOptions(): DisplayOptions {
  if (typeof localStorage === 'undefined') return DEFAULT_DISPLAY_OPTIONS
  try {
    const raw = localStorage.getItem(DISPLAY_OPTIONS_STORAGE_KEY)
    if (!raw) return DEFAULT_DISPLAY_OPTIONS
    return parseDisplayOptions(JSON.parse(raw))
  } catch (error) {
    warnDev('display-options: failed to parse stored options', error)
    return DEFAULT_DISPLAY_OPTIONS
  }
}

export function saveDisplayOptions(options: DisplayOptions): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(DISPLAY_OPTIONS_STORAGE_KEY, JSON.stringify(parseDisplayOptions(options)))
  } catch (error) {
    warnDev('display-options: failed to persist options', error)
  }
}

export function mergeDisplayOptions(updates: Partial<DisplayOptions>): DisplayOptions {
  const next = parseDisplayOptions({ ...loadDisplayOptions(), ...updates })
  saveDisplayOptions(next)
  return next
}
