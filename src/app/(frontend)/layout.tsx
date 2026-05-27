import React, { Suspense } from 'react'
import Script from 'next/script'
import { Onest } from 'next/font/google'
import { getPayload } from 'payload'
import config from '@payload-config'
import Header from '@/components/header'
import CookieBanner from '@/components/cookie-banner'
import { CookieConsentProvider } from '@/components/cookie-banner/context'
import { ShortcutGrid } from '@/components/shortcut/grid'
import { ShortcutRegistryProvider } from '@/components/shortcut/registry-context'
import { WindowManagerProvider } from '@/components/window/WindowManagerProvider'
import './styles.css'
import 'remixicon/fonts/remixicon.css'

const onest = Onest({ subsets: ['latin'] })

export const metadata = {
  description: "Dimm's OS is a portfolio website showcasing the projects and skills of Dimm, a product designer.",
  title: "Dimm's OS - Portfolio website",
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
    payload.find({ collection: 'windows',  select, depth: 0, limit: 200 }),
    payload.find({ collection: 'articles', select, depth: 0, limit: 200 }),
    payload.find({ collection: 'forms',    select, depth: 0, limit: 200 }),
  ])

  const allDocs = [
    ...windows.docs.map((doc) => ({ ...doc, _col: 'windows'  as CollectionSlug, _href: `/${doc.slug ?? ''}` })),
    ...articles.docs.map((doc) => ({ ...doc, _col: 'articles' as CollectionSlug, _href: `/${doc.slug ?? ''}` })),
    ...forms.docs.map((doc)    => ({ ...doc, _col: 'forms'    as CollectionSlug, _href: `/${(doc as any).slug ?? ''}` })),
  ]

  // Registry: all docs regardless of showShortcut, so the taskbar can look up any open page
  const registryEntries = allDocs.map((doc) => ({
    icon:     doc.shortcutIcon ?? 'ri-file-fill',
    name:     doc.shortcutName ?? doc.title,
    slug:     doc.slug ?? (doc as any).slug ?? '',
    color:    COLLECTION_META[doc._col].color,
    category: doc._col,
  }))

  // Shortcuts grid: only docs with showShortcut, sorted by order
  const shortcuts = allDocs
    .filter((doc) => (doc as any).showShortcut)
    .sort((a, b) => ((a as any).shortcutOrder ?? Infinity) - ((b as any).shortcutOrder ?? Infinity))
    .map((doc) => ({
      icon:     doc.shortcutIcon ?? 'ri-file-fill',
      name:     doc.shortcutName ?? doc.title,
      href:     doc._href,
      slug:     doc.slug ?? (doc as any).slug ?? '',
      color:    COLLECTION_META[doc._col].color,
      category: doc._col,
    }))

  return { shortcuts, registryEntries }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const { shortcuts, registryEntries } = await fetchData()

  return (
    <html lang="en" className={onest.className}>
      <body>
        {/* Google Consent Mode v2 — fires before hydration, Next.js injects this into <head> */}
        <Script src="/consent-init.js" strategy="beforeInteractive" />
        <CookieConsentProvider>
          <Suspense>
            <ShortcutRegistryProvider shortcuts={registryEntries}>
              <WindowManagerProvider>
                <Header />
                <main>
                  <div className="grid grid-cols-[repeat(var(--cols),var(--tile))] auto-rows-[calc(2*var(--tile))]">
                    <ShortcutGrid shortcuts={shortcuts} />
                  </div>
                  {children}
                </main>
                <CookieBanner />
              </WindowManagerProvider>
            </ShortcutRegistryProvider>
          </Suspense>
        </CookieConsentProvider>
      </body>
    </html>
  )
}
