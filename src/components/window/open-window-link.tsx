'use client'

import Link from 'next/link'
import type { AnchorHTMLAttributes } from 'react'
import { useWindowManagerContext } from './manager-context'

interface OpenWindowLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  slug: string
  children: React.ReactNode
  className?: string
}

export function OpenWindowLink({ slug, children, className, ...rest }: OpenWindowLinkProps) {
  const { open } = useWindowManagerContext()

  function handleClick(e: React.MouseEvent) {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      e.preventDefault()
      open(slug)
    }
  }

  return (
    <Link href={`/${slug}`} onClick={handleClick} className={className} {...rest}>
      {children}
    </Link>
  )
}
