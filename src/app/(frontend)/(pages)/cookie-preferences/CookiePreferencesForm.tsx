'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WindowScaffold } from '@/components/window/window-scaffold'
import { footerButtonClass } from '@/components/window/footer-button'
import { useCookieConsent } from '@/components/cookie-banner/context'
import { SetWindowOptions } from '@/components/window/title-context'
import type { CookieService, CookieSetting } from '@/payload-types'

// Fields the listing actually renders — matches the select in page.tsx
type CookieServiceItem = Pick<
  CookieService,
  'id' | 'name' | 'category' | 'legalName' | 'description' | 'privacyPolicyUrl' | 'cookies'
>

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
  analytics: 'Analytics cookies allow me to analyze your visits and actions so we can make our service better.',
  marketing: 'Used for targeted advertising and remarketing.',
}

/** iOS-style switch. Accessible name drives the tests. */
function Toggle({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`flex items-center w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
        checked ? 'bg-brand' : 'bg-fg/25'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`w-5 h-5 rounded-full bg-fg shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

interface Props {
  services: CookieServiceItem[]
  settings: CookieSetting
}

export function CookiePreferencesForm({ services, settings }: Props) {
  const { consent, isLoading, saveConsent } = useCookieConsent()
  const router = useRouter()

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['essential']),
  )
  const syncedRef = useRef(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedService, setExpandedService] = useState<number | null>(null)
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

  const byCategory = services.reduce<Record<string, CookieServiceItem[]>>((acc, svc) => {
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
    <WindowScaffold
      footer={
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={footerButtonClass('primary', 'w-full')}
        >
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      }
    >
      <div className="px-6 pt-4 pb-6 flex flex-col">
        <SetWindowOptions disableMinimize />

        {settings.description && (
          <p className="text-fg/70 text-sm mb-2">{settings.description}</p>
        )}

        <div className="flex flex-col">
          {CATEGORY_ORDER.map((category) => {
            const isEssential = category === 'essential'
            const isSelected = isEssential || selectedCategories.has(category)
            const isCatExpanded = expandedCategory === category
            const categoryServices = byCategory[category] ?? []

            return (
              <div key={category} className="border-t border-fg/10 first:border-t-0">
                <div className="flex items-center gap-3 py-4">
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(isCatExpanded ? null : category)}
                    aria-expanded={isCatExpanded}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <i
                      className={`${isCatExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-lg text-fg/50 shrink-0`}
                    />
                    <span className="font-semibold text-fg">{CATEGORY_LABELS[category]}</span>
                  </button>

                  {isEssential ? (
                    <>
                      <span className="px-3 py-1.5 rounded-full bg-fg/10 text-fg/60 text-xs font-medium whitespace-nowrap">
                        Always enabled
                      </span>
                      {/* Accessible, disabled switch kept for assistive tech + tests */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={true}
                        aria-label="Toggle Essential"
                        disabled
                        className="sr-only"
                      />
                    </>
                  ) : (
                    <Toggle
                      label={`Toggle ${CATEGORY_LABELS[category]}`}
                      checked={isSelected}
                      onToggle={() => toggle(category)}
                    />
                  )}
                </div>

                {isCatExpanded && (
                  <div className="pb-5 flex flex-col gap-4">
                    <p className="text-fg/60 text-sm">{CATEGORY_DESCRIPTIONS[category]}</p>

                    {categoryServices.map((svc) => {
                      const isSvcExpanded = expandedService === svc.id
                      return (
                        <div key={svc.id} className="border-t border-fg/10 pt-3 pl-6">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setExpandedService(isSvcExpanded ? null : svc.id)}
                              aria-expanded={isSvcExpanded}
                              className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                            >
                              <i
                                className={`${isSvcExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-lg text-fg/50 shrink-0`}
                              />
                              <span className="font-semibold text-fg text-sm">{svc.name}</span>
                            </button>
                            {isEssential ? (
                              <span className="px-3 py-1.5 rounded-full bg-fg/10 text-fg/60 text-xs font-medium whitespace-nowrap">
                                Always required
                              </span>
                            ) : (
                              /* Service toggle mirrors/drives its parent category (consent is category-level) */
                              <Toggle
                                label={`Toggle ${svc.name}`}
                                checked={isSelected}
                                onToggle={() => toggle(category)}
                              />
                            )}
                          </div>

                          {isSvcExpanded && (
                            <div className="pl-7 pt-2 flex flex-col gap-2">
                              {svc.description && (
                                <p className="text-fg/60 text-xs leading-relaxed">{svc.description}</p>
                              )}

                              {(svc.legalName || svc.privacyPolicyUrl) && (
                                <div className="flex items-center flex-wrap gap-2 text-xs">
                                  {svc.legalName && <span className="text-fg/70">{svc.legalName}</span>}
                                  {svc.privacyPolicyUrl && (
                                    <a
                                      href={svc.privacyPolicyUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-fg underline inline-flex items-center gap-0.5"
                                    >
                                      Privacy policy
                                      <i className="ri-arrow-right-up-line text-[0.9em]" />
                                    </a>
                                  )}
                                </div>
                              )}

                              {svc.cookies && svc.cookies.length > 0 && (
                                <table className="w-full text-xs mt-1 border-collapse">
                                  <thead>
                                    <tr className="text-fg/40">
                                      <th className="text-left py-1 pr-2 font-medium">Name</th>
                                      <th className="text-left py-1 font-medium">Duration</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {svc.cookies.map((cookie, i) => (
                                      <tr key={i} className="border-t border-fg/5 text-fg/60">
                                        <td className="py-1.5 pr-2 font-mono">{cookie.name ?? '—'}</td>
                                        <td className="py-1.5">{cookie.duration ?? '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </WindowScaffold>
  )
}
