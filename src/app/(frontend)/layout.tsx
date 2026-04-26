import React from 'react'
import { Onest } from 'next/font/google'
import Header from '@/components/header'
import CookieBanner from '@/components/cookie-banner'
import { Shortcut } from '@/components/shortcut'
import './styles.css'
import 'remixicon/fonts/remixicon.css'

const onest = Onest({ subsets: ['latin'] })

export const metadata = {
  description: 'Dimm\'s OS is a portfolio website showcasing the projects and skills of Dimm, a product designer.',
  title: 'Dimm\'s OS - Portfolio website',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={onest.className}>
      <body>
        <Header />
        <main>
          <div className="grid grid-cols-[repeat(6,var(--tile))] auto-rows-[calc(2*var(--tile))]">
            <Shortcut icon="ri-folder-fill" name="Works" href="/works" color="#F5A623" />
            <Shortcut icon="ri-folder-fill" name="Works" href="/works" color="#F5A623" />
            <Shortcut icon="ri-folder-fill" name="Works" href="/works" color="#F5A623" />
            <Shortcut icon="ri-folder-fill" name="Works" href="/works" color="#F5A623" />
            <Shortcut icon="ri-folder-fill" name="Works" href="/works" color="#F5A623" />
          </div>
          {children}
        </main>
        <CookieBanner />
      </body>
    </html>
  )
}