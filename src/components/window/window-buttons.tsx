'use client'

import { OpenWindowLink } from './open-window-link'
import { footerButtonClass } from './footer-button'
import type { WindowButton } from '@/payload-types'

// WindowButton is generated as the whole array type; this is a single row.
type WindowButtonItem = NonNullable<WindowButton>[number]

function buttonClass(style: WindowButtonItem['style']) {
  return footerButtonClass(style === 'secondary' ? 'secondary' : 'primary', 'flex-1 min-w-[8rem]')
}

/**
 * CMS-authored action buttons, rendered in the window footer. Internal buttons
 * open another window (desktop) / navigate (mobile) via OpenWindowLink;
 * external buttons are plain links. A pair splits the row; a single button
 * spans full width.
 */
export function WindowButtons({ buttons }: { buttons: NonNullable<WindowButton> }) {
  if (!buttons?.length) return null

  return (
    <div data-window-buttons="" className="flex flex-wrap gap-3">
      {buttons.map((button, i) => {
        const isExternal = button.target === 'external'

        if (isExternal) {
          if (!button.href) return null
          return (
            <a
              key={button.id ?? i}
              href={button.href}
              target={button.openInNewTab ? '_blank' : undefined}
              rel={button.openInNewTab ? 'noopener noreferrer' : undefined}
              className={buttonClass(button.style)}
            >
              {button.label}
            </a>
          )
        }

        if (!button.slug) return null
        return (
          <OpenWindowLink key={button.id ?? i} slug={button.slug} className={buttonClass(button.style)}>
            {button.label}
          </OpenWindowLink>
        )
      })}
    </div>
  )
}
