'use client'

import { useEffect } from 'react'
import { usePostHog } from '@posthog/next'
import { useCookieConsent } from '@/components/cookie-banner/context'

export function PostHogConsentGate() {
  const posthog = usePostHog()
  const { consent, isLoading } = useCookieConsent()

  useEffect(() => {
    if (isLoading || !posthog) return
    const hasAnalytics = consent?.categories.includes('analytics') ?? false
    if (hasAnalytics) {
      posthog.opt_in_capturing()
    } else {
      posthog.opt_out_capturing()
    }
  }, [posthog, consent, isLoading])

  return null
}
