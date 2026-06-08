import { getWindowContent, type WindowContentResult } from '@/actions/getWindowContent'

// Module-level promise cache — shared across all window instances, persists for the session.
// Pre-seeded for shortcut windows at SSR time; populated for on-demand windows at open/navigate time.
export const promiseCache = new Map<string, Promise<WindowContentResult>>()

/** Pre-seed the cache with SSR data. Idempotent — only sets if slug not yet cached. */
export function seedPromise(slug: string, data: WindowContentResult | null): void {
  if (!promiseCache.has(slug)) {
    promiseCache.set(slug, Promise.resolve(data))
  }
}

/**
 * Returns the cached promise for slug, creating it via the server action if needed.
 * Must be called from event handlers or effects — never from render body.
 * During SSR returns a placeholder to avoid "Server Functions cannot be called during initial render".
 */
export function getOrCreatePromise(slug: string): Promise<WindowContentResult> {
  if (!promiseCache.has(slug)) {
    if (typeof window === 'undefined') {
      // SSR: placeholder only — client will fetch on demand via useEffect
      return Promise.resolve(null)
    }
    promiseCache.set(slug, getWindowContent(slug))
  }
  return promiseCache.get(slug)!
}
