// Route-transition loading UI. Next.js nests this inside the (frontend) layout,
// so it replaces only the page content — the wallpaper and header persist. Kept
// deliberately non-covering (transparent, below the header, no full-screen
// backdrop) so client-side transitions feel native and never blank the desktop.
// The first-load splash is handled separately by <RoutePreloader /> in the layout.
export default function Loading() {
  return (
    <div
      aria-label="Loading"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-1 flex items-center justify-center"
      role="status"
      style={{ top: 'var(--header-height)' }}
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-fg/20 border-t-brand" />
    </div>
  )
}
