import React from 'react'
import { Onest } from 'next/font/google'
import { getPayload } from 'payload'
import config from '@payload-config'
import Header from '@/components/header'
import CookieBanner from '@/components/cookie-banner'
import { Shortcut } from '@/components/shortcut'
import './styles.css'
import 'remixicon/fonts/remixicon.css'

const onest = Onest({ subsets: ['latin'] })

export const metadata = {
  description: "Dimm's OS is a portfolio website showcasing the projects and skills of Dimm, a product designer.",
  title: "Dimm's OS - Portfolio website",
}

const COLLECTION_META = {
  windows: { color: '#4A9EFF' },
  works:   { color: '#F5A623' },
  forms:   { color: '#E3465A' },
} as const

type CollectionSlug = keyof typeof COLLECTION_META

async function fetchShortcuts() {
  const payload = await getPayload({ config })
  const where = { showShortcut: { equals: true } }

  const [windows, works, forms] = await Promise.all([
    payload.find({ collection: 'windows', where }),
    payload.find({ collection: 'works',   where }),
    payload.find({ collection: 'forms',   where }),
  ])

  return [
    ...windows.docs.map((doc) => ({ ...doc, _slug: 'windows' as CollectionSlug, _href: `/${(doc as any).slug ?? 'windows'}` })),
    ...works.docs.map((doc)   => ({ ...doc, _slug: 'works'   as CollectionSlug, _href: `/${(doc as any).slug ?? 'works'}` })),
    ...forms.docs.map((doc)   => ({ ...doc, _slug: 'forms'   as CollectionSlug, _href: `/${(doc as any).slug ?? ''}` })),
  ]
    .sort((a, b) => (a.shortcutOrder ?? Infinity) - (b.shortcutOrder ?? Infinity))
    .map((doc) => ({
      icon:  doc.shortcutIcon  ?? 'ri-file-fill',
      name:  doc.shortcutName  ?? doc.title,
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
      </body>
    </html>
  )
}
