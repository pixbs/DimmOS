import React, { Suspense } from 'react'
import Script from 'next/script'
import { Onest } from 'next/font/google'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { PostHogProvider, PostHogPageView } from '@posthog/next'
import Header from '@/components/header'
import CookieBanner from '@/components/cookie-banner'
import { CookieConsentProvider } from '@/components/cookie-banner/context'
import { PostHogConsentGate } from '@/components/analytics/PostHogConsentGate'
import { SentryReplayProvider } from '@/components/analytics/SentryReplayProvider'
import { ShortcutGrid } from '@/components/shortcut/grid'
import { ShortcutRegistryProvider } from '@/components/shortcut/registry-context'
import { WindowManagerProvider } from '@/components/window/WindowManagerProvider'
import { fetchAllShortcutContents } from '@/lib/windowContent'
import { DesktopWallpaper } from '@/components/desktop-wallpaper'
import { DisplayOptionsProvider } from '@/components/display-options'
import { DesktopCursor } from '@/components/desktop-cursor'
import { DesktopContextMenu } from '@/components/context-menu'
import './styles.css'
import 'remixicon/fonts/remixicon.css'

export const dynamic = 'force-dynamic'

const onest = Onest({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Dimm's OS",
  description: 'Interactive OS-style portfolio — an OS-metaphor desktop built on Next.js + Payload CMS.',
  openGraph: { title: "Dimm's OS" },
  twitter: { card: 'summary_large_image' },
}

const COLLECTION_META = {
  windows:  { color: '#4A9EFF' },
  articles: { color: '#F5A623' },
  forms:    { color: '#E3465A' },
} as const

type CollectionSlug = keyof typeof COLLECTION_META

async function fetchData() {
  const payload = await getPayload({ config })
  // Fetch all docs (no showShortcut filter) so the registry covers every possible window,
  // including pages opened via direct URL navigation that may not have showShortcut set.
  const select = { title: true, slug: true, shortcutName: true, shortcutIcon: true, shortcutOrder: true, showShortcut: true } as const

  const [windows, articles, forms] = await Promise.all([
    payload.find({ collection: 'windows',  select, depth: 0, limit: 200, overrideAccess: false }),
    payload.find({ collection: 'articles', select, depth: 0, limit: 200, overrideAccess: false }),
    payload.find({ collection: 'forms',    select, depth: 0, limit: 200, overrideAccess: false }),
  ])

  const allDocs = [
    ...windows.docs.map((doc) => ({ ...doc, _col: 'windows'  as CollectionSlug, _href: `/${doc.slug}` })),
    ...articles.docs.map((doc) => ({ ...doc, _col: 'articles' as CollectionSlug, _href: `/${doc.slug}` })),
    ...forms.docs.map((doc)    => ({ ...doc, _col: 'forms'    as CollectionSlug, _href: `/${doc.slug}` })),
  ]

  // Registry: all docs regardless of showShortcut, so the taskbar can look up any open page
  const registryEntries = allDocs.map((doc) => ({
    icon:     doc.shortcutIcon ?? 'ri-file-fill',
    name:     doc.shortcutName ?? doc.title,
    slug:     doc.slug,
    color:    COLLECTION_META[doc._col].color,
    category: doc._col,
  }))

  // Shortcuts grid: only docs with showShortcut, sorted by order
  const shortcuts = allDocs
    .filter((doc) => doc.showShortcut)
    .sort((a, b) => (a.shortcutOrder ?? Infinity) - (b.shortcutOrder ?? Infinity))
    .map((doc) => ({
      icon:     doc.shortcutIcon ?? 'ri-file-fill',
      name:     doc.shortcutName ?? doc.title,
      href:     doc._href,
      slug:     doc.slug,
      color:    COLLECTION_META[doc._col].color,
      category: doc._col,
    }))

  const shortcutSlugs = shortcuts.map((s) => s.slug)
  const preloadedContents = await fetchAllShortcutContents(shortcutSlugs)

  return { shortcuts, registryEntries, shortcutSlugs, preloadedContents }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const { shortcuts, registryEntries, shortcutSlugs, preloadedContents } = await fetchData()

  return (
    <html lang="en" className={onest.className} suppressHydrationWarning>
      <body>
        {/* Google Consent Mode v2 — fires before hydration, Next.js injects this into <head> */}
        <Script src="/consent-init.js" strategy="beforeInteractive" />
        <Script
          id="display-options-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = 'website';
                  var raw = localStorage.getItem('display-options:v1');
                  if (raw) {
                    var parsed = JSON.parse(raw);
                    if (parsed && parsed.cursorMode === 'system') mode = 'system';
                  }
                  document.documentElement.dataset.dimmCursor = mode;
                } catch (e) {
                  document.documentElement.dataset.dimmCursor = 'website';
                }
              })();
            `,
          }}
        />
        <PostHogProvider clientOptions={{ opt_out_capturing_by_default: true }}>
          <CookieConsentProvider>
            <PostHogConsentGate />
            <SentryReplayProvider />
            <PostHogPageView />
            <Suspense>
              <DisplayOptionsProvider>
                <ShortcutRegistryProvider shortcuts={registryEntries}>
                  <WindowManagerProvider preloadedContents={preloadedContents} shortcutSlugs={shortcutSlugs}>
                    <Header />
                    <main>
                      <DesktopWallpaper />
                      <div className="relative z-1 h-[calc(100vh-var(--header-height))]">
                        <ShortcutGrid shortcuts={shortcuts} />
                      </div>
                      {children}
                    </main>
                    <CookieBanner />
                    <DesktopContextMenu />
                    <DesktopCursor />
                  </WindowManagerProvider>
                </ShortcutRegistryProvider>
              </DisplayOptionsProvider>
            </Suspense>
          </CookieConsentProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
