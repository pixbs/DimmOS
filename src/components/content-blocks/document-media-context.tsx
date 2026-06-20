'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Media } from '@/payload-types'
import type { ParallaxLayer } from '@/components/animation'

/**
 * The current document's background/foreground images, used by the Hero section.
 *
 * The Hero block carries no image of its own — it pulls the article-level
 * `bgImage`/`fgImage` pair from this context. Provided by the article render
 * paths ({@link DocumentMediaProvider}); absent for windows (which have no Hero).
 */
export interface DocumentMedia {
  background: ParallaxLayer | null
  foreground: ParallaxLayer | null
}

const DocumentMediaContext = createContext<DocumentMedia>({ background: null, foreground: null })

/** Convert a Payload upload field value into a parallax layer, or `null` when unset/unpopulated. */
function toLayer(value: number | Media | null | undefined): ParallaxLayer | null {
  if (!value || typeof value === 'number' || !value.url) return null
  return {
    src: value.url,
    alt: value.alt ?? '',
    width: value.width ?? 1600,
    height: value.height ?? 900,
  }
}

/**
 * Provide the document's bg/fg images to descendant Hero sections.
 *
 * Accepts the raw Payload upload values (populated `Media` objects at depth ≥ 1)
 * and resolves them to {@link ParallaxLayer}s for {@link useDocumentMedia}.
 */
export function DocumentMediaProvider({
  background,
  foreground,
  children,
}: {
  background?: number | Media | null
  foreground?: number | Media | null
  children: ReactNode
}) {
  const value: DocumentMedia = {
    background: toLayer(background),
    foreground: toLayer(foreground),
  }
  return <DocumentMediaContext.Provider value={value}>{children}</DocumentMediaContext.Provider>
}

/** Read the current document's bg/fg images (both `null` outside a provider). */
export function useDocumentMedia(): DocumentMedia {
  return useContext(DocumentMediaContext)
}
