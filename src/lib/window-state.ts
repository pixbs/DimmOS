const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s)
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
  slug: string
  zIndex: number
  minimized: boolean
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
    return parsed.filter(
      (w): w is ManagedWindow =>
        typeof w === 'object' &&
        w !== null &&
        isValidSlug(w.slug) &&
        typeof w.zIndex === 'number' &&
        typeof w.minimized === 'boolean',
    )
  } catch {
    return []
  }
}

export function saveWindowsToSession(wins: ManagedWindow[]): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(wins))
  } catch {
    // quota exceeded or private browsing
  }
}
