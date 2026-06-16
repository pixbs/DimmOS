import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

interface RevalidationOptions {
  /** Extra paths to revalidate beyond /{slug} and / (e.g. listing routes) */
  extraPaths?: string[]
}

/**
 * Shared afterChange/afterDelete revalidation pair for content collections.
 * Invalidates the window-content cache tag plus the document's own path and /.
 *
 * The try/catch must stay silent: hooks also fire from test seeds and CLI
 * scripts that run outside Next.js's request store, where revalidate* throws.
 */
export function createRevalidationHooks(options: RevalidationOptions = {}): {
  afterChange: CollectionAfterChangeHook[]
  afterDelete: CollectionAfterDeleteHook[]
} {
  const { extraPaths = [] } = options

  function revalidate(slug: unknown): void {
    try {
      revalidateTag('window-content', {})
      revalidatePath(`/${slug}`)
      revalidatePath('/')
      for (const path of extraPaths) revalidatePath(path)
    } catch {}
  }

  return {
    afterChange: [
      async ({ doc, req }) => {
        if (req.context.skipHooks) return
        req.context.skipHooks = true
        revalidate(doc.slug)
        req.context.skipHooks = false
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        revalidate(doc.slug)
      },
    ],
  }
}
