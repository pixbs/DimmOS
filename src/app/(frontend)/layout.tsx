import React from 'react'
import Script from 'next/script'
import { Onest } from 'next/font/google'
import { getPayload } from 'payload'
import config from '@payload-config'
import Header from '@/components/header'
import CookieBanner from '@/components/cookie-banner'
import { CookieConsentProvider } from '@/components/cookie-banner/context'
import { Shortcut } from '@/components/shortcut'
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

async function fetchShortcuts() {
  const payload = await getPayload({ config })
  const where = { showShortcut: { equals: true } }
  const select = { title: true, slug: true, shortcutName: true, shortcutIcon: true, shortcutOrder: true } as const

  const [windows, articles, forms] = await Promise.all([
    payload.find({ collection: 'windows',  where, select, depth: 0, limit: 100 }),
    payload.find({ collection: 'articles', where, select, depth: 0, limit: 100 }),
    payload.find({ collection: 'forms',    where, select, depth: 0, limit: 100 }),
  ])

  return [
    ...windows.docs.map((doc) => ({ ...doc, _slug: 'windows'  as CollectionSlug, _href: `/${doc.slug ?? ''}` })),
    ...articles.docs.map((doc) => ({ ...doc, _slug: 'articles' as CollectionSlug, _href: `/${doc.slug ?? ''}` })),
    ...forms.docs.map((doc)    => ({ ...doc, _slug: 'forms'    as CollectionSlug, _href: `/${(doc as any).slug ?? ''}` })),
  ]
    .sort((a, b) => (a.shortcutOrder ?? Infinity) - (b.shortcutOrder ?? Infinity))
    .map((doc) => ({
      icon:  doc.shortcutIcon ?? 'ri-file-fill',
      name:  doc.shortcutName ?? doc.title,
      href:  doc._href,
      color: COLLECTION_META[doc._slug].color,
    }))
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const shortcuts = await fetchShortcuts()

  return (
    <html lang="en" className={onest.className}>
      <body>
        {/* Google Consent Mode v2 — fires before hydration, Next.js injects this into <head> */}
        <Script src="/consent-init.js" strategy="beforeInteractive" />
        <CookieConsentProvider>
          <Header />
          <main>
            <div className="grid grid-cols-[repeat(var(--cols),var(--tile))] auto-rows-[calc(2*var(--tile))]">
              {shortcuts.map((s, i) => (
                <Shortcut key={i} icon={s.icon} name={s.name} href={s.href} color={s.color} />
              ))}
            </div>
            {children}
          </main>
          <CookieBanner />
        </CookieConsentProvider>
      </body>
    </html>
  )
}
