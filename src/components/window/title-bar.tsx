'use client'

import type { PointerEventHandler } from 'react'
import { cn } from '@/lib/utils'

interface TitleBarProps {
  title: string
  onClose: () => void
  onMinimize?: () => void
  onExpand?: () => void
  onPointerDown: PointerEventHandler<HTMLDivElement>
  disableMinimize?: boolean
  disableClose?: boolean
  expandable?: boolean
  expanded?: boolean
  /** Accessible name for the close button. Defaults to "Close". */
  closeLabel?: string
  /** Relative-position class for the bar. Defaults to the window selector
   *  `win-titlebar--bar`; pass a different class to keep non-window title bars
   *  (e.g. the cookie banner) out of window-scoped test/style selectors. */
  barClassName?: string
}

interface TrafficLightButtonProps {
  label: string
  symbol: string
  activeColor: string
  hoverColor: string
  cursorAction: 'close' | 'collapse' | 'expand' | 'restore'
  disabled?: boolean
  onClick?: () => void
}

function TrafficLightButton({
  label,
  symbol,
  activeColor,
  hoverColor,
  cursorAction,
  disabled,
  onClick,
}: TrafficLightButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      data-cursor-action={disabled ? undefined : cursorAction}
      disabled={disabled}
      className="w-5 h-5 flex items-center justify-center group"
    >
      <div className={cn(
        'w-2.5 h-2.5 rounded-full transition-all flex items-center justify-center',
        disabled
          ? 'bg-fg/10 cursor-not-allowed'
          : `${activeColor} ${hoverColor} group-hover:scale-150`,
      )}>
        {!disabled && (
          <span className="opacity-0 group-hover:opacity-100 text-xs text-black/60 font-bold leading-none">
            {symbol}
          </span>
        )}
      </div>
    </button>
  )
}

export function WindowTitleBar({
  title,
  onClose,
  onMinimize,
  onExpand,
  onPointerDown,
  disableMinimize,
  disableClose,
  expandable,
  expanded,
  closeLabel = 'Close',
  barClassName = 'win-titlebar--bar',
}: TitleBarProps) {
  return (
    <div
      className={`win-titlebar ${barClassName} items-center px-3 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none`}
      style={{ height: '2.25rem' }}
      onPointerDown={onPointerDown}
    >
      <div className="flex z-10" onPointerDown={(e) => e.stopPropagation()}>
        <TrafficLightButton
          label={closeLabel}
          symbol="×"
          activeColor="bg-win-close"
          hoverColor="hover:bg-win-close-hover"
          cursorAction="close"
          disabled={disableClose}
          onClick={onClose}
        />
        <TrafficLightButton
          label="Minimize"
          symbol="–"
          activeColor="bg-win-minimize"
          hoverColor="hover:bg-win-minimize-hover"
          cursorAction="collapse"
          disabled={disableMinimize}
          onClick={onMinimize}
        />
        <TrafficLightButton
          label={expanded ? 'Restore window' : 'Expand to full screen'}
          symbol={expanded ? '↙' : '↗'}
          activeColor="bg-win-expand"
          hoverColor="hover:bg-win-expand-hover"
          cursorAction={expanded ? 'restore' : 'expand'}
          disabled={!expandable}
          onClick={expandable ? onExpand : undefined}
        />
      </div>

      <span className="absolute left-0 right-0 text-center text-xs tracking-wide text-fg/80 pointer-events-none truncate px-16">
        {title}
      </span>
    </div>
  )
}
