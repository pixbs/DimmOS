'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const STORAGE_KEY = 'cookie-consent'
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000

export type ConsentState = {
  consentId: string
  categories: string[]
  timestamp: number
  version: string
}

type CookieConsentContextValue = {
  consent: ConsentState | null
  needsBanner: boolean
  isLoading: boolean
  saveConsent: (categories: string[]) => Promise<void>
  resetConsent: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider')
  return ctx
}

function readLocalConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ConsentState
  } catch {
    return null
  }
}

function isConsentValid(consent: ConsentState | null, currentVersion: string): boolean {
  if (!consent) return false
  if (Date.now() - consent.timestamp > SIX_MONTHS_MS) return false
  if (consent.version !== currentVersion) return false
  return true
}

function updateConsentModeSignals(categories: string[]) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', {
    analytics_storage: categories.includes('analytics') ? 'granted' : 'denied',
    ad_storage: categories.includes('marketing') ? 'granted' : 'denied',
    ad_user_data: categories.includes('marketing') ? 'granted' : 'denied',
    ad_personalization: categories.includes('marketing') ? 'granted' : 'denied',
    functionality_storage: categories.includes('functional') ? 'granted' : 'denied',
    personalization_storage: categories.includes('functional') ? 'granted' : 'denied',
  })
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [currentVersion, setCurrentVersion] = useState('1.0')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = readLocalConsent()
    setConsent(stored)

    fetch('/api/globals/cookie-settings?depth=0')
      .then((r) => r.json())
      .then((data) => {
        const version = data?.consentVersion ?? '1.0'
        setCurrentVersion(version)
      })
      .catch(() => {
        // keep default version '1.0'
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // Re-fire consent signals on hydration if consent already exists
  useEffect(() => {
    if (!isLoading && consent && isConsentValid(consent, currentVersion)) {
      updateConsentModeSignals(consent.categories)
    }
  }, [isLoading, consent, currentVersion])

  const needsBanner = !isLoading && !isConsentValid(consent, currentVersion)

  async function saveConsent(categories: string[]) {
    const consentId = crypto.randomUUID()
    const state: ConsentState = {
      consentId,
      categories,
      timestamp: Date.now(),
      version: currentVersion,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setConsent(state)
    updateConsentModeSignals(categories)

    try {
      await fetch('/api/cookie-consents/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentId,
          categories,
          language: navigator.language,
          consentVersion: currentVersion,
        }),
      })
    } catch {
      // Audit log failure is non-fatal — consent is still stored locally
    }
  }

  function resetConsent() {
    localStorage.removeItem(STORAGE_KEY)
    setConsent(null)
  }

  return (
    <CookieConsentContext.Provider
      value={{ consent, needsBanner, isLoading, saveConsent, resetConsent }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}
