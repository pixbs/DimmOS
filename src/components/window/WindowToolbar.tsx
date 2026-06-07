'use client'

import { useWindowToolbar } from './window-toolbar-context'

export function WindowToolbar() {
  const { behavior, searchQuery, setSearchQuery, viewMode, setViewMode, canGoBack, canGoForward, back, forward } =
    useWindowToolbar()

  const hasAnyFlag = behavior.displaySearch || behavior.displayViewToggle || behavior.displayHistory
  if (!hasAnyFlag) return null

  return (
    <div
      data-window-toolbar=""
      data-view-mode={viewMode}
      className="flex items-center gap-1.5 px-2 py-1 border-b border-white/10 bg-black/20 shrink-0"
    >
      {/* History navigation: back always visible (mobile + desktop), forward desktop-only */}
      {behavior.displayHistory && (
        <>
          <button
            aria-label="Go back"
            disabled={!canGoBack}
            onClick={back}
            className="flex items-center justify-center w-7 h-7 rounded-md text-fg/60 hover:text-fg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ri-arrow-left-s-line text-base" />
          </button>
          <button
            aria-label="Go forward"
            disabled={!canGoForward}
            onClick={forward}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-fg/60 hover:text-fg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ri-arrow-right-s-line text-base" />
          </button>
        </>
      )}

      {/* Separator after history buttons when mixed with other controls */}
      {behavior.displayHistory && (behavior.displaySearch || behavior.displayViewToggle) && (
        <div className="hidden lg:block w-px h-4 bg-white/15 mx-0.5" />
      )}

      {/* Search — desktop only */}
      {behavior.displaySearch && (
        <div className="hidden lg:flex flex-1 items-center gap-1.5 bg-white/8 rounded-md px-2 py-1 min-w-0">
          <i className="ri-search-line text-xs text-fg/40 shrink-0" />
          <input
            type="search"
            aria-label="Search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg/30 outline-none min-w-0"
          />
        </div>
      )}

      {/* Spacer pushes view toggle to the right when search is absent */}
      {!behavior.displaySearch && <div className="hidden lg:block flex-1" />}

      {/* View toggle — desktop only */}
      {behavior.displayViewToggle && (
        <div className="hidden lg:flex items-center gap-0.5">
          <button
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
            className={[
              'flex items-center justify-center w-7 h-7 rounded-md text-base transition-colors',
              viewMode === 'grid'
                ? 'text-fg bg-white/15'
                : 'text-fg/40 hover:text-fg hover:bg-white/10',
            ].join(' ')}
          >
            <i className="ri-layout-grid-line" />
          </button>
          <button
            aria-label="Table view"
            aria-pressed={viewMode === 'table'}
            onClick={() => setViewMode('table')}
            className={[
              'flex items-center justify-center w-7 h-7 rounded-md text-base transition-colors',
              viewMode === 'table'
                ? 'text-fg bg-white/15'
                : 'text-fg/40 hover:text-fg hover:bg-white/10',
            ].join(' ')}
          >
            <i className="ri-table-view" />
          </button>
        </div>
      )}
    </div>
  )
}
