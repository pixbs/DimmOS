'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DrawerCloseButton } from '@/components/drawer/close-button'
import { useCookieConsent } from '@/components/cookie-banner/context'
import { SetWindowOptions } from '@/components/window/title-context'
import type { CookieService, CookieSetting } from '@/payload-types'

const CATEGORY_ORDER = ['essential', 'functional', 'analytics', 'marketing'] as const
const CATEGORY_LABELS: Record<string, string> = {
  essential: 'Essential',
  functional: 'Functional',
  analytics: 'Analytics',
  marketing: 'Marketing',
}
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  essential: 'Required for the site to function. Cannot be disabled.',
  functional: 'Enhance your experience (e.g. language preferences, accessibility).',
  analytics: 'Help understand how the site is used so it can be improved.',
  marketing: 'Used for targeted advertising and remarketing.',
}

interface Props {
  services: CookieService[]
  settings: CookieSetting
}

export function CookiePreferencesForm({ services, settings }: Props) {
  const { consent, isLoading, saveConsent } = useCookieConsent()
  const router = useRouter()

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['essential']),
  )
  const syncedRef = useRef(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Sync selections from stored consent once the context finishes loading.
  // useState initializer only runs once, so we must update via useEffect when
  // consent arrives asynchronously (loaded from localStorage after mount).
  useEffect(() => {
    if (!isLoading && !syncedRef.current) {
      syncedRef.current = true
      setSelectedCategories(new Set(consent?.categories ?? ['essential']))
    }
  }, [isLoading, consent])

  const byCategory = services.reduce<Record<string, CookieService[]>>((acc, svc) => {
    acc[svc.category] = [...(acc[svc.category] ?? []), svc]
    return acc
  }, {})

  function toggle(category: string) {
    if (category === 'essential') return
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    await saveConsent(Array.from(selectedCategories))
    router.push('/')
  }

  return (
    <div className="px-6 pb-10 flex flex-col gap-6">
      <SetWindowOptions disableMinimize />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">{settings.title ?? 'Cookie Preferences'}</h1>
        {settings.description && (
          <p className="text-fg/70 text-sm">{settings.description}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {CATEGORY_ORDER.map((category) => {
          const isEssential = category === 'essential'
          const isSelected = selectedCategories.has(category)
          const isExpanded = expanded === category
          const categoryServices = byCategory[category] ?? []

          return (
            <div key={category} className="border border-fg/10 rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-4">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isSelected}
                  aria-label={`Toggle ${CATEGORY_LABELS[category]}`}
                  disabled={isEssential}
                  onClick={() => toggle(category)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                    isSelected ? 'bg-brand' : 'bg-fg/20'
                  } ${isEssential ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      isSelected ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-fg text-sm">
                    {CATEGORY_LABELS[category]}
                    {isEssential && (
                      <span className="ml-2 text-xs text-fg/50 font-normal">Always active</span>
                    )}
                  </div>
                  <div className="text-fg/60 text-xs mt-0.5">{CATEGORY_DESCRIPTIONS[category]}</div>
                </div>

                {categoryServices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : category)}
                    className="text-fg/40 text-xs cursor-pointer flex-shrink-0"
                    aria-expanded={isExpanded}
                  >
                    {categoryServices.length} {categoryServices.length === 1 ? 'service' : 'services'}{' '}
                    {isExpanded ? '▲' : '▼'}
                  </button>
                )}
              </div>

              {isExpanded && categoryServices.length > 0 && (
                <div className="border-t border-fg/10 px-4 py-3 flex flex-col gap-4">
                  {categoryServices.map((svc) => (
                    <div key={svc.id} className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-fg text-sm">{svc.name}</span>
                        {svc.legalName && (
                          <span className="text-fg/50 text-xs">{svc.legalName}</span>
                        )}
                      </div>

                      {svc.description && (
                        <p className="text-fg/60 text-xs">{svc.description}</p>
                      )}

                      {svc.privacyPolicyUrl && (
                        <a
                          href={svc.privacyPolicyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-fg/50 text-xs underline"
                        >
                          Privacy Policy
                        </a>
                      )}

                      {svc.cookies && svc.cookies.length > 0 && (
                        <table className="w-full text-xs mt-1 border-collapse">
                          <thead>
                            <tr className="text-fg/40">
                              <th className="text-left py-1 pr-2 font-medium">Name</th>
                              <th className="text-left py-1 pr-2 font-medium">Type</th>
                              <th className="text-left py-1 pr-2 font-medium">Duration</th>
                              <th className="text-left py-1 font-medium">Purpose</th>
                            </tr>
                          </thead>
                          <tbody>
                            {svc.cookies.map((cookie, i) => (
                              <tr key={i} className="border-t border-fg/5 text-fg/60">
                                <td className="py-1 pr-2 font-mono">{cookie.name ?? '—'}</td>
                                <td className="py-1 pr-2">{cookie.storageType ?? '—'}</td>
                                <td className="py-1 pr-2">{cookie.duration ?? '—'}</td>
                                <td className="py-1">{cookie.description ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-full bg-brand text-white font-semibold text-sm cursor-pointer disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
        <DrawerCloseButton className="w-full py-4 rounded-full bg-fg/5 text-fg font-semibold text-sm cursor-pointer" aria-label="dismiss">
          Close
        </DrawerCloseButton>
      </div>
    </div>
  )
}
