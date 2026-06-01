'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { MouseEventHandler } from 'react'

interface ShortcutProps {
  icon: string
  name: string
  href: string
  color: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export function Shortcut({ icon, name, href, color, onClick }: ShortcutProps) {
  const [pressing, setPressing] = useState(false)

  return (
    <Link
      href={href}
      onClick={onClick}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      onPointerCancel={() => setPressing(false)}
      className="col-span-2 flex flex-col items-center gap-2 no-underline text-white [-webkit-tap-highlight-color:transparent] justify-center"
    >
      <div
        className="h-12 w-12 rounded-md flex items-center justify-center text-[24px] leading-none"
        style={{
          background: pressing
            ? `color-mix(in srgb, ${color} 30%, transparent)`
            : `color-mix(in srgb, ${color} 22%, #0d0d0d)`,
          backdropFilter: pressing ? 'blur(12px)' : 'none',
          transform: pressing ? 'scale(0.92)' : 'scale(1)',
          transition: 'background 120ms ease, backdrop-filter 120ms ease, transform 120ms ease',
          color,
        }}
      >
        <i className={icon} />
      </div>
      <span className="text-[0.8125rem] text-center whitespace-nowrap">{name}</span>
    </Link>
  )
}
