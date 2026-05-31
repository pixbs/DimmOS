'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CookieBannerShell } from './shell'
import { useDrawer } from '@/components/drawer/context'
import { useCookieConsent } from './context'

function CookieBannerInner() {
  const { needsBanner, isLoading, saveConsent } = useCookieConsent()
  const { open, close } = useDrawer()
  const pathname = usePathname()
  const router = useRouter()

  const suppressBanner = pathname === '/cookie-preferences'

  useEffect(() => {
    if (!isLoading && needsBanner && !suppressBanner) {
      open()
    } else {
      close()
    }
  }, [needsBanner, isLoading, suppressBanner])

  return (
    <div className="px-6 pb-10 flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-fg">Cookie Notice</h2>

      <div className="flex flex-col gap-3 text-fg/70 text-sm">
        <p>
          I use essential cookies to make this site work. I would also like to use optional
          cookies that help me understand how this site is used and support improvements to its
          experience. These optional cookies will only be set if you choose to allow them.
        </p>
        <p>
          By accepting, you consent to the use of optional cookies. By rejecting, only essential
          cookies will be used.
        </p>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <button
          type="button"
          onClick={() => {
            close()
            router.push('/cookie-preferences')
          }}
          className="w-full py-4 rounded-full bg-fg/5 text-fg font-semibold text-sm cursor-pointer"
        >
          Configure
        </button>
        <button
          type="button"
          onClick={() => saveConsent(['essential'])}
          className="w-full py-4 rounded-full bg-brand text-white font-semibold text-sm cursor-pointer"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => saveConsent(['essential', 'functional', 'analytics', 'marketing'])}
          className="w-full py-4 rounded-full bg-brand text-white font-semibold text-sm cursor-pointer"
        >
          Accept All
        </button>
      </div>
    </div>
  )
}

export default function CookieBanner() {
  return (
    <CookieBannerShell>
      <CookieBannerInner />
    </CookieBannerShell>
  )
}
