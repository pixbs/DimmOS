import type { CookieService, CookieSetting } from '@/payload-types'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { CookiePreferencesForm } from '@/app/(frontend)/(pages)/cookie-preferences/CookiePreferencesForm'
import { CookieConsentProvider } from '@/components/cookie-banner/context'
import { DisplayOptionsProvider } from '@/components/display-options'
import {
  CookieNoticeSystemWindow,
  DisplayOptionsSystemWindow,
} from '@/components/window/system-windows'
import { WindowTitleProvider } from '@/components/window/title-context'
import { browserWorker } from '../mocks/browser'

const settings = {
  id: 1,
  title: 'Privacy choices',
  description: 'Choose which optional services may run.',
  consentVersion: '2.0',
} as CookieSetting

const services = [
  {
    id: 12,
    name: 'Private analytics',
    category: 'analytics',
    legalName: 'Example Analytics GmbH',
    description: 'Measures aggregate product usage.',
    privacyPolicyUrl: 'https://example.test/privacy',
    cookies: [{ name: 'analytics_session', duration: '30 days' }],
  },
] as CookieService[]

function useCookieSettings(version = '2.0') {
  browserWorker.use(
    http.get('*/api/globals/cookie-settings', () =>
      HttpResponse.json({ consentVersion: version }),
    ),
  )
}

describe('cookie controls', () => {
  it('stores accepted categories, records the audit payload, and closes the notice', async () => {
    useCookieSettings()
    const audits: unknown[] = []
    browserWorker.use(
      http.post('*/api/cookie-consents/record', async ({ request }) => {
        audits.push(await request.json())
        return HttpResponse.json({ ok: true })
      }),
    )
    const close = vi.fn()
    const gtag = vi.fn()
    window.gtag = gtag

    const screen = await render(
      <CookieConsentProvider>
        <CookieNoticeSystemWindow
          data={{ cookieServices: services, cookieSettings: settings }}
          close={close}
          openSystem={() => {}}
        />
      </CookieConsentProvider>,
    )

    await screen.getByRole('button', { name: 'Accept All' }).click()

    await expect.poll(() => close.mock.calls).toHaveLength(1)
    expect(audits).toHaveLength(1)
    const stored = JSON.parse(localStorage.getItem('cookie-consent') ?? '{}')
    expect(stored.categories).toEqual(['essential', 'functional', 'analytics', 'marketing'])
    expect(stored.version).toBe('2.0')
    expect(audits[0]).toMatchObject({
      categories: ['essential', 'functional', 'analytics', 'marketing'],
      consentVersion: '2.0',
    })
    expect(gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'granted', ad_storage: 'granted' }),
    )
    delete window.gtag
  })

  it('opens configuration without writing consent', async () => {
    useCookieSettings()
    const close = vi.fn()
    const openSystem = vi.fn()
    const screen = await render(
      <CookieConsentProvider>
        <CookieNoticeSystemWindow
          data={{ cookieServices: services, cookieSettings: settings }}
          close={close}
          openSystem={openSystem}
        />
      </CookieConsentProvider>,
    )

    await screen.getByRole('button', { name: 'Configure' }).click()

    expect(close).toHaveBeenCalledOnce()
    expect(openSystem).toHaveBeenCalledWith('cookie-preferences')
    expect(localStorage.getItem('cookie-consent')).toBeNull()
  })

  it('edits category consent, reveals service details, and saves through the provider', async () => {
    useCookieSettings()
    let auditBody: unknown
    browserWorker.use(
      http.post('*/api/cookie-consents/record', async ({ request }) => {
        auditBody = await request.json()
        return HttpResponse.json({ ok: true })
      }),
    )
    const onSaved = vi.fn()
    const screen = await render(
      <CookieConsentProvider>
        <WindowTitleProvider>
          <CookiePreferencesForm services={services} settings={settings} onSaved={onSaved} />
        </WindowTitleProvider>
      </CookieConsentProvider>,
    )

    const essential = screen.getByRole('switch', { name: 'Toggle Essential' })
    await expect.element(essential).toBeChecked()
    await expect.element(essential).toBeDisabled()

    await screen.getByRole('switch', { name: 'Toggle Analytics' }).click()
    await screen.getByRole('button', { name: 'Analytics' }).click()
    await screen.getByRole('button', { name: 'Private analytics' }).click()
    await expect.element(screen.getByText('Measures aggregate product usage.')).toBeVisible()
    await expect.element(screen.getByRole('link', { name: /Privacy policy/ })).toHaveAttribute(
      'href',
      'https://example.test/privacy',
    )

    await screen.getByRole('button', { name: 'Save Preferences' }).click()

    await expect.poll(() => auditBody).toMatchObject({ categories: ['essential', 'analytics'] })
    await expect.poll(() => onSaved.mock.calls).toHaveLength(1)
  })
})

describe('display controls', () => {
  it('loads, applies, persists, and toggles the website cursor preference', async () => {
    localStorage.setItem('display-options:v1', JSON.stringify({ cursorMode: 'system' }))
    const screen = await render(
      <DisplayOptionsProvider>
        <DisplayOptionsSystemWindow
          data={{ cookieServices: services, cookieSettings: settings }}
          close={() => {}}
          openSystem={() => {}}
        />
      </DisplayOptionsProvider>,
    )
    const cursorSwitch = screen.getByRole('switch', { name: 'Use website cursor' })

    await expect.element(cursorSwitch).not.toBeChecked()
    expect(document.documentElement.dataset.dimmCursor).toBe('system')
    await cursorSwitch.click()

    await expect.element(cursorSwitch).toBeChecked()
    expect(document.documentElement.dataset.dimmCursor).toBe('website')
    expect(JSON.parse(localStorage.getItem('display-options:v1') ?? '{}')).toEqual({
      cursorMode: 'website',
    })
  })
})
