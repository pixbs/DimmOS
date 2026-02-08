import React from 'react'
import './styles.css'
import Shortcut from '@/components/organisms/shortcut'
import { Onest } from 'next/font/google'
import Link from 'next/link'

const onest = Onest({
  subsets: ['latin'],
  variable: '--font-onest',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={`${onest.className} font-sans`}>
      <body>
        <header>
          <Link href="/" className="logo">
            DimmOS
          </Link>
        </header>
        <main>
          <Shortcut name='Welcome' color="green" href="/welcome" icon="Computer" />
          <Shortcut name='Works' href="/works" icon="Folder5" />
          <Shortcut name='Services' href="/services" icon="Folder5" />
          <Shortcut name='Contact' color="blue" href="/contact" icon='Mail' />
          {children}
        </main>
        <nav>
          <Shortcut name='Welcome' color="green" href="/welcome" hasTitle={false} icon="Computer" />
          <Shortcut name='Works' href="/works" hasTitle={false} icon="Folder5" />
        </nav>
      </body>
    </html>
  )
}
