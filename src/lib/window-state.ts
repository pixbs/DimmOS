const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const SYSTEM_WINDOW_KEYS = ['cookie-notice', 'cookie-preferences', 'display-options'] as const

export type SystemWindowKey = (typeof SYSTEM_WINDOW_KEYS)[number]
export type ManagedWindowKind = 'content' | 'system'
export type ContentWindowId = `content:${string}`
export type SystemWindowId = `system:${SystemWindowKey}`
export type ManagedWindowId = ContentWindowId | SystemWindowId

function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s)
}

export function contentWindowId(slug: string): ContentWindowId {
  return `content:${slug}`
}

export function systemWindowId(key: SystemWindowKey): SystemWindowId {
  return `system:${key}`
}

export function isSystemWindowKey(key: string): key is SystemWindowKey {
  return (SYSTEM_WINDOW_KEYS as readonly string[]).includes(key)
}

export function isSystemWindowId(id: string): id is SystemWindowId {
  if (!id.startsWith('system:')) return false
  return isSystemWindowKey(id.slice('system:'.length))
}

export function parseOpenWindows(
  searchParams: URLSearchParams | { get(key: string): string | null },
): string[] {
  const raw = searchParams.get('open') ?? ''
  if (!raw) return []
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(isValidSlug))]
}

export function serializeOpenWindows(slugs: string[]): string {
  return slugs.filter(isValidSlug).join(',')
}

// --- Window session state ---

export interface ManagedWindow {
  /** Typed stable identity, e.g. content:about or system:cookie-notice. */
  id: ManagedWindowId
  kind: ManagedWindowKind
  systemKey?: SystemWindowKey
  /** Stable identity: preloading, localStorage key, animation targets. Never changes. */
  rootSlug: string
  /** Current content slug — changes on in-window navigation. What the taskbar shows. */
  slug: string
  /** Full navigation stack, e.g. ['services', 'web-design'] */
  historyStack: string[]
  /** Current position in historyStack */
  historyIndex: number
  zIndex: number
  minimized: boolean
  cascadeIndex: number
  /** Set to true to signal the window component to run its collapse animation before minimizing */
  pendingMinimize: boolean
}

export const BASE_Z = 50

const SESSION_KEY = 'open-windows'

export function loadWindowsFromSession(): ManagedWindow[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (w): boolean =>
          typeof w === 'object' &&
          w !== null &&
          isValidSlug(w.slug) &&
          typeof w.zIndex === 'number' &&
          typeof w.minimized === 'boolean',
      )
      .map((w): ManagedWindow => ({
        id: contentWindowId(w.slug),
        kind: 'content',
        rootSlug: w.slug,   // saved as 'slug' for backward compat; always restore at root
        slug: w.slug,
        historyStack: [w.slug],
        historyIndex: 0,
        zIndex: w.zIndex,
        minimized: w.minimized,
        cascadeIndex: typeof w.cascadeIndex === 'number' ? w.cascadeIndex : 0,
        pendingMinimize: false,
      }))
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('window-state: failed to restore windows from sessionStorage', error)
    }
    return []
  }
}

export function saveWindowsToSession(wins: ManagedWindow[]): void {
  if (typeof window === 'undefined') return
  try {
    // Save rootSlug as 'slug' for backward compat; history not persisted (always restores fresh)
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify(
        wins
          .filter((w) => w.kind === 'content')
          .map((w) => ({
            slug: w.rootSlug,
            zIndex: w.zIndex,
            minimized: w.minimized,
            cascadeIndex: w.cascadeIndex,
          })),
      ),
    )
  } catch (error) {
    // quota exceeded or private browsing — open-window list simply isn't persisted
    if (process.env.NODE_ENV === 'development') {
      console.warn('window-state: failed to persist windows to sessionStorage', error)
    }
  }
}
