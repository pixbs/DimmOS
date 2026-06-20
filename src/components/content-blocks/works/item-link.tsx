'use client'

import type { ReactNode } from 'react'
import { OpenWindowLink } from '@/components/window/open-window-link'

/**
 * Clickable wrapper for a Works item, shared by the grid and table views.
 *
 * In the interactive client renderer an `onSelect` callback is provided, so the
 * item is a `<button data-article-item>` that opens/navigates via the window
 * manager. In the server renderer no callback is passed, so it falls back to an
 * `<OpenWindowLink data-article-card>` (desktop-open / mobile-navigate). Both
 * data attributes are relied on by the e2e suite.
 */
export function WorksItemLink({
  slug,
  onSelect,
  className,
  children,
}: {
  slug: string
  onSelect?: (slug: string) => void
  className?: string
  children: ReactNode
}) {
  if (onSelect) {
    return (
      <button type="button" data-article-item="" onClick={() => onSelect(slug)} className={className}>
        {children}
      </button>
    )
  }
  return (
    <OpenWindowLink slug={slug} data-article-card="" className={className}>
      {children}
    </OpenWindowLink>
  )
}
