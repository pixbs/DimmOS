'use client'

import Link from 'next/link'
import { useWindowManagerContext } from './manager-context'

interface OpenWindowLinkProps {
  slug: string
  children: React.ReactNode
  className?: string
}

export function OpenWindowLink({ slug, children, className }: OpenWindowLinkProps) {
  const { open } = useWindowManagerContext()

  function handleClick(e: React.MouseEvent) {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      e.preventDefault()
      open(slug)
    }
  }

  return (
    <Link href={`/${slug}`} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}
