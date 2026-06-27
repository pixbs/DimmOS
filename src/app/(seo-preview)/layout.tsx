import { type ReactNode } from 'react'
import { Onest } from 'next/font/google'
import '@/app/(frontend)/styles.css'
import 'remixicon/fonts/remixicon.css'

const onest = Onest({ subsets: ['latin'] })

export const dynamic = 'force-dynamic'

export default function SeoPreviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={onest.className} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
