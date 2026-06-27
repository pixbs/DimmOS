import React, { Suspense } from 'react'
import Script from 'next/script'
import { Onest } from 'next/font/google'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { PostHogProvider, PostHogPageView } from '@posthog/next'
import Header from '@/components/header'
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
import { RoutePreloader } from '@/components/preloader/route-preloader'
import './styles.css'
import 'remixicon/fonts/remixicon.css'

export const dynamic = 'force-dynamic'

const onest = Onest({ subsets: ['latin'] })
const SITE_TITLE = "Dimm's OS"

export const metadata: Metadata = {
  title: "Dimm's OS",
  description: 'Interactive OS-style portfolio — an OS-metaphor desktop built on Next.js + Payload CMS.',
  openGraph: { title: "Dimm's OS", images: [{ url: '/og' }] },
  twitter: { card: 'summary_large_image' },
}

const COLLECTION_META = {
  windows:  { color: '#4A9EFF' },
  articles: { color: '#F5A623' },
  forms:    { color: '#E3465A' },
} as const

type CollectionSlug = keyof typeof COLLECTION_META

function getDocumentTitle(doc: {
  _col: CollectionSlug
  meta?: { title?: string | null } | null
  title: string
}): string {
  if (doc.meta?.title) return doc.meta.title
  if (doc._col === 'forms') return doc.title
  return `${doc.title} \u2014 ${SITE_TITLE}`
}

async function fetchData() {
  const payload = await getPayload({ config })
  // Fetch all docs (no showShortcut filter) so the registry covers every possible window,
  // including pages opened via direct URL navigation that may not have showShortcut set.
  const contentSelect = {
    title: true,
    slug: true,
    meta: true,
    shortcutName: true,
    shortcutIcon: true,
    shortcutOrder: true,
    showShortcut: true,
    windowOpenOnStartup: true,
    windowStartupViewports: true,
    windowStartupOrder: true,
  } as const
  const formSelect = { title: true, slug: true, shortcutName: true, shortcutIcon: true, shortcutOrder: true, showShortcut: true } as const

  const [windows, articles, forms, cookieServices, cookieSettings] = await Promise.all([
    payload.find({ collection: 'windows',  select: contentSelect, depth: 0, limit: 200, overrideAccess: false }),
    payload.find({ collection: 'articles', select: contentSelect, depth: 0, limit: 200, overrideAccess: false }),
    payload.find({ collection: 'forms',    select: formSelect, depth: 0, limit: 200, overrideAccess: false }),
    payload.find({
      collection: 'cookie-services',
      select: {
        name: true,
        category: true,
        legalName: true,
        description: true,
        privacyPolicyUrl: true,
        cookies: true,
      } as const,
      limit: 100,
      depth: 0,
      overrideAccess: false,
    }),
    payload.findGlobal({ slug: 'cookie-settings', overrideAccess: false }),
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
    title:    doc.title,
    documentTitle: getDocumentTitle(doc),
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
  const startupWindows = [...windows.docs, ...articles.docs]
    .filter((doc) => doc.windowOpenOnStartup)
    .sort((a, b) => {
      const startupDelta = (a.windowStartupOrder ?? 0) - (b.windowStartupOrder ?? 0)
      if (startupDelta !== 0) return startupDelta
      const shortcutDelta = (a.shortcutOrder ?? Infinity) - (b.shortcutOrder ?? Infinity)
      if (shortcutDelta !== 0) return shortcutDelta
      return a.title.localeCompare(b.title)
    })
    .map((doc) => ({
      slug: doc.slug,
      viewports: (doc.windowStartupViewports?.length ? doc.windowStartupViewports : ['desktop']) as ('desktop' | 'mobile')[],
    }))

  const preloadedContentSlugs = [...new Set([...shortcutSlugs, ...startupWindows.map((entry) => entry.slug)])]
  const preloadedContents = await fetchAllShortcutContents(preloadedContentSlugs)

  return {
    shortcuts,
    registryEntries,
    shortcutSlugs,
    startupWindows,
    preloadedContents,
    systemWindowData: {
      cookieSettings,
      cookieServices: cookieServices.docs,
    },
  }
}

async function FrontendDataShell({ children }: { children: React.ReactNode }) {
  const { shortcuts, registryEntries, shortcutSlugs, startupWindows, preloadedContents, systemWindowData } = await fetchData()

  return (
    <DisplayOptionsProvider>
      <ShortcutRegistryProvider shortcuts={registryEntries}>
        <WindowManagerProvider
          preloadedContents={preloadedContents}
          shortcutSlugs={shortcutSlugs}
          startupWindows={startupWindows}
          systemWindowData={systemWindowData}
        >
          <Header />
          <main>
            <DesktopWallpaper />
            <div className="relative z-1 h-[calc(100vh-var(--header-height))]">
              <ShortcutGrid shortcuts={shortcuts} />
            </div>
            {children}
          </main>
          <DesktopContextMenu />
          <DesktopCursor />
        </WindowManagerProvider>
      </ShortcutRegistryProvider>
    </DisplayOptionsProvider>
  )
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

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
            <Suspense fallback={<RoutePreloader />}>
              <FrontendDataShell>{children}</FrontendDataShell>
            </Suspense>
          </CookieConsentProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
