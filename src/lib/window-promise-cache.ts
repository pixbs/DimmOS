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
    const p = getWindowContent(slug)
    promiseCache.set(slug, p)
    // Evict on failure so the next open retries instead of replaying a cached
    // rejection for the rest of the session. Identity check guards against
    // deleting a newer promise that has already replaced this one.
    p.catch(() => {
      if (promiseCache.get(slug) === p) promiseCache.delete(slug)
    })
  }
  return promiseCache.get(slug)!
}

export function evictPromise(slug: string): void {
  promiseCache.delete(slug)
}

/** Evict a window's slugs on close so reopening refetches instead of serving session-stale data. */
export function evictPromises(slugs: string[]): void {
  for (const slug of slugs) promiseCache.delete(slug)
}
