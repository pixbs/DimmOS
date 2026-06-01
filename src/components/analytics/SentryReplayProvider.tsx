'use client'

import { useEffect, useRef } from 'react'
import { useCookieConsent } from '@/components/cookie-banner/context'

export function SentryReplayProvider() {
  const { consent, isLoading } = useCookieConsent()
  const replayStarted = useRef(false)

  useEffect(() => {
    if (isLoading) return
    const hasFunctional = consent?.categories.includes('functional') ?? false

    if (hasFunctional && !replayStarted.current) {
      replayStarted.current = true
      import('@sentry/browser').then(({ replayIntegration, addIntegration }) => {
        addIntegration(
          replayIntegration({
            maskAllText: false,
            blockAllMedia: true,
          }),
        )
      }).catch(() => {
        // Sentry replay not critical — ignore load errors
      })
    }
  }, [consent, isLoading])

  return null
}
