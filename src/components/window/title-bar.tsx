'use client'

import type { PointerEventHandler } from 'react'

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
      {/* Traffic lights */}
      <div className="flex z-10" onPointerDown={(e) => e.stopPropagation()}>
        <button
          onClick={disableClose ? undefined : onClose}
          aria-label="Close"
          disabled={disableClose}
          className="w-6 h-6 flex items-center justify-center group"
        >
          <div className={`w-3 h-3 rounded-full transition-all flex items-center justify-center ${
            disableClose
              ? 'bg-fg/10 cursor-not-allowed'
              : 'bg-[#FF5F57] hover:bg-[#FF3B30] group-hover:scale-150'
          }`}>
            {!disableClose && (
              <span className="opacity-0 group-hover:opacity-100 text-xs text-black/60 font-bold leading-none">×</span>
            )}
          </div>
        </button>
        <button
          onClick={disableMinimize ? undefined : onMinimize}
          aria-label="Minimize"
          disabled={disableMinimize}
          className="w-6 h-6 flex items-center justify-center group"
        >
          <div className={`w-3 h-3 rounded-full transition-all flex items-center justify-center ${
            disableMinimize
              ? 'bg-fg/10 cursor-not-allowed'
              : 'bg-[#FEBC2E] hover:bg-[#FF9500] group-hover:scale-150'
          }`}>
            {!disableMinimize && (
              <span className="opacity-0 group-hover:opacity-100 text-xs leading-none text-black/60 font-bold">–</span>
            )}
          </div>
        </button>
        <button
          onClick={expandable ? onExpand : undefined}
          aria-label={expanded ? 'Restore window' : 'Expand to full screen'}
          disabled={!expandable}
          className="w-6 h-6 flex items-center justify-center group"
        >
          <div className={`w-3 h-3 rounded-full transition-all flex items-center justify-center ${
            !expandable
              ? 'bg-fg/10 cursor-default'
              : 'bg-[#28C840] hover:bg-[#20B232] group-hover:scale-150'
          }`}>
            {expandable && (
              <span className="opacity-0 group-hover:opacity-100 text-xs text-black/60 font-bold leading-none">
                {expanded ? '↙' : '↗'}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Centred title */}
      <span className="absolute left-0 right-0 text-center text-xs tracking-wide opacity-40 pointer-events-none truncate px-16">
        {title}
      </span>
    </div>
  )
}
