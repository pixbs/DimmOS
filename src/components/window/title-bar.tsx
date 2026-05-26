'use client'

import type { PointerEventHandler } from 'react'

interface TitleBarProps {
  title: string
  onClose: () => void
  onMinimize?: () => void
  onPointerDown: PointerEventHandler<HTMLDivElement>
}

export function WindowTitleBar({
  title,
  onClose,
  onMinimize,
  onPointerDown,
}: TitleBarProps) {
  return (
    <div
      className="win-titlebar win-titlebar--bar items-center px-3 shrink-0 border-b border-fg/10 cursor-grab active:cursor-grabbing touch-none select-none"
      style={{ height: '2.25rem' }}
      onPointerDown={onPointerDown}
    >
      {/* Traffic lights */}
      <div className="flex gap-1.5 z-10" onPointerDown={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF3B30] transition-colors flex items-center justify-center group"
        >
          <span className="opacity-0 group-hover:opacity-100 text-[7px] leading-none text-black/60 font-bold">×</span>
        </button>
        <button
          onClick={onMinimize}
          aria-label="Minimize"
          className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:bg-[#FF9500] transition-colors flex items-center justify-center group"
        >
          <span className="opacity-0 group-hover:opacity-100 text-[7px] leading-none text-black/60 font-bold">–</span>
        </button>
        <button
          aria-label="Maximize (unavailable)"
          disabled
          className="w-3 h-3 rounded-full bg-fg/10 cursor-default"
        />
      </div>

      {/* Centred title */}
      <span className="absolute left-0 right-0 text-center text-xs tracking-wide opacity-40 pointer-events-none truncate px-16">
        {title}
      </span>
    </div>
  )
}
