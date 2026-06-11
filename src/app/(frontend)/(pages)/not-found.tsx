'use client'

import { usePathname } from 'next/navigation'
import { SetWindowTitle } from '@/components/window/title-context'
import { BSODContent } from '@/components/window/BSODContent'

export default function NotFoundPage() {
  const pathname = usePathname()
  const slug = pathname === '/' ? '' : pathname.slice(1)
  const title = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Not Found'

  return (
    <>
      <SetWindowTitle title={title} />
      <BSODContent slug={slug} />
    </>
  )
}
