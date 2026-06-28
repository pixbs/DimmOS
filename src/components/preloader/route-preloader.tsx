export function RoutePreloader() {
  return (
    <div
      aria-label="Loading"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-bgs text-fg"
      data-route-preloader=""
      role="status"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-fg/10 bg-bg">
        <div className="grid grid-cols-2 gap-1.5">
          <span className="h-3 w-3 animate-pulse rounded-sm bg-brand" />
          <span className="h-3 w-3 animate-pulse rounded-sm bg-fg/45 [animation-delay:120ms]" />
          <span className="h-3 w-3 animate-pulse rounded-sm bg-fg/45 [animation-delay:240ms]" />
          <span className="h-3 w-3 animate-pulse rounded-sm bg-brand [animation-delay:360ms]" />
        </div>
      </div>
    </div>
  )
}
