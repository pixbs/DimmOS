import type { Page } from '@playwright/test'

import { E2E_CONSENT_VERSION } from '../fixtures/e2e-values'

export async function installClientState(
  page: Page,
  options: {
    consentCategories?: string[] | null
    cursor?: 'system' | 'website'
    suppressStartup?: boolean
  } = {},
): Promise<void> {
  await page.addInitScript(
    ({ consentCategories, consentVersion, cursor, suppressStartup }) => {
      const stateInstalled = sessionStorage.getItem('e2e-client-state-installed') === 'true'
      if (!stateInstalled) {
        if (consentCategories) {
          localStorage.setItem(
            'cookie-consent',
            JSON.stringify({
              consentId: 'e2e-initial-consent',
              categories: consentCategories,
              timestamp: Date.now(),
              version: consentVersion,
            }),
          )
        } else {
          localStorage.removeItem('cookie-consent')
        }
        localStorage.setItem('display-options:v1', JSON.stringify({ cursorMode: cursor }))
        sessionStorage.setItem('e2e-client-state-installed', 'true')
      }
      if (suppressStartup) {
        sessionStorage.setItem('managed-startup-opened:desktop', 'true')
        sessionStorage.setItem('managed-startup-opened:mobile', 'true')
      }
    },
    {
      consentCategories: options.consentCategories === undefined ? ['essential'] : options.consentCategories,
      consentVersion: E2E_CONSENT_VERSION,
      cursor: options.cursor ?? 'system',
      suppressStartup: options.suppressStartup ?? true,
    },
  )
}

export async function readWindowGeometry(page: Page, key: string) {
  return page.evaluate((storageKey) => {
    const all = JSON.parse(localStorage.getItem('window-positions') ?? '{}') as Record<
      string,
      { h?: number; w?: number; x?: number; y?: number }
    >
    return all[storageKey] ?? null
  }, key)
}
