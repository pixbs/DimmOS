'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { MouseEventHandler } from 'react'
import { cn } from '@/lib/utils'

interface ShortcutProps {
  icon: string
  name: string
  href: string
  color: string
  slug?: string
  className?: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export function Shortcut({ icon, name, href, color, slug, className, onClick }: ShortcutProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      data-shortcut-slug={slug}
      data-cursor-action="window"
      draggable={false}
      className={cn(
        'flex flex-col items-center justify-center gap-2 no-underline text-white [-webkit-tap-highlight-color:transparent]',
        className ?? 'col-span-2',
      )}
    >
      <motion.div
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className="h-12 w-12 rounded-md flex items-center justify-center text-[24px] leading-none"
        style={{
          background: `color-mix(in srgb, ${color} 22%, #0d0d0d)`,
          transition: 'background 120ms ease, backdrop-filter 120ms ease',
          color,
        }}
      >
        <i className={icon} />
      </motion.div>
      <span className="text-[0.8125rem] text-center whitespace-nowrap">{name}</span>
    </Link>
  )
}
