import Link from 'next/link'
import Drawer from '@/components/drawer'
import { DrawerTrigger } from '@/components/drawer/trigger'
import { DrawerCloseButton } from '@/components/drawer/close-button'

export default function TestPage() {
  return (
    <div className="p-6 flex flex-col gap-10 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-fg">Drawer Test Page</h1>
        <p className="text-fg/40 text-sm mt-1">/test — validate all drawer interactions</p>
      </div>

      <section className="flex flex-col gap-3">
        <Label>1 · Cookie Banner</Label>
        <p className="text-fg/60 text-sm">Auto-shows on every page load via layout. Already visible above.</p>
        <Checklist items={[
          'Drag handle downward past ~40% → dismisses',
          'Click backdrop → dismisses',
          'Press Escape → dismisses',
          'Reject / Accept All / Configure buttons → dismisses',
        ]} />
      </section>

      <section className="flex flex-col gap-3">
        <Label>2 · Page Drawer</Label>
        <p className="text-fg/60 text-sm">
          Sub-routes render server-side content inside a full-height drawer. Closing navigates back to <code className="text-fg/80">/</code>.
        </p>
        <Link
          href="/works"
          className="w-full py-3 rounded-xl bg-fg/5 border border-fg/10 text-fg text-sm font-medium text-center"
        >
          Navigate to /works →
        </Link>
        <Checklist items={[
          'Drawer slides up below the header',
          'Header stays visible and interactive',
          'Drag handle downward past ~25% → closes, returns to /',
          'Press Escape → same result',
          'Hard-refresh /works → view-source shows full content (SSR)',
        ]} />
      </section>

      <section className="flex flex-col gap-3">
        <Label>3 · Manual Trigger</Label>
        <p className="text-fg/60 text-sm">Bottom sheet opened programmatically via a trigger button.</p>

        <Drawer
          trigger={
            <DrawerTrigger className="w-full py-3 rounded-xl bg-fg/5 border border-fg/10 text-fg text-sm font-medium cursor-pointer">
              Open Bottom Sheet
            </DrawerTrigger>
          }
        >
          <div className="px-6 pb-10 flex flex-col gap-4 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-fg">Demo Sheet</h2>
            <p className="text-fg/60 text-sm">Drag the handle, click outside, press Escape, or use the button below.</p>
            <DrawerCloseButton className="w-full py-3 rounded-xl bg-fg/5 border border-fg/10 text-fg text-sm font-medium mt-2 cursor-pointer">
              Close
            </DrawerCloseButton>
          </div>
        </Drawer>

        <Checklist items={[
          'Trigger button opens the sheet',
          'Drag handle downward past ~40% → dismisses',
          'Click backdrop → dismisses',
          'Press Escape → dismisses',
          'Close button → dismisses',
        ]} />
      </section>

      <section className="flex flex-col gap-3">
        <Label>4 · Independence</Label>
        <p className="text-fg/60 text-sm">Each drawer owns its own state. Closing one must never affect the others.</p>
        <Checklist items={[
          'Open the bottom sheet, then interact with the cookie banner → no interference',
          'Navigate to /works with cookie banner visible → both show independently',
        ]} />
      </section>
    </div>
  )
}

function Label({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-semibold text-fg/40 uppercase tracking-widest">{children}</h2>
  )
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-fg/50 text-xs">
          <span className="mt-px shrink-0">—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
