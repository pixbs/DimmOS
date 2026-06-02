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
}

interface TrafficLightButtonProps {
  label: string
  symbol: string
  activeColor: string
  hoverColor: string
  disabled?: boolean
  onClick?: () => void
}

function TrafficLightButton({ label, symbol, activeColor, hoverColor, disabled, onClick }: TrafficLightButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      disabled={disabled}
      className="w-6 h-6 flex items-center justify-center group"
    >
      <div className={cn(
        'w-3 h-3 rounded-full transition-all flex items-center justify-center',
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
}: TitleBarProps) {
  return (
    <div
      className="win-titlebar win-titlebar--bar items-center px-3 shrink-0 border-b border-fg/10 cursor-grab active:cursor-grabbing touch-none select-none"
      style={{ height: '2.25rem' }}
      onPointerDown={onPointerDown}
    >
      <div className="flex z-10" onPointerDown={(e) => e.stopPropagation()}>
        <TrafficLightButton
          label="Close"
          symbol="×"
          activeColor="bg-win-close"
          hoverColor="hover:bg-win-close-hover"
          disabled={disableClose}
          onClick={onClose}
        />
        <TrafficLightButton
          label="Minimize"
          symbol="–"
          activeColor="bg-win-minimize"
          hoverColor="hover:bg-win-minimize-hover"
          disabled={disableMinimize}
          onClick={onMinimize}
        />
        <TrafficLightButton
          label={expanded ? 'Restore window' : 'Expand to full screen'}
          symbol={expanded ? '↙' : '↗'}
          activeColor="bg-win-expand"
          hoverColor="hover:bg-win-expand-hover"
          disabled={!expandable}
          onClick={expandable ? onExpand : undefined}
        />
      </div>

      <span className="absolute left-0 right-0 text-center text-xs tracking-wide opacity-40 pointer-events-none truncate px-16">
        {title}
      </span>
    </div>
  )
}
