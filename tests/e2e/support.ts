import type { Page } from '@playwright/test'

export const E2E_CONSENT_VERSION = 'e2e-v1'

export async function installClientState(
  page: Page,
  options: { cursor?: 'system' | 'website'; suppressStartup?: boolean } = {},
): Promise<void> {
  await page.addInitScript(
    ({ consentVersion, cursor, suppressStartup }) => {
      localStorage.setItem(
        'cookie-consent',
        JSON.stringify({
          consentId: 'e2e-essential-consent',
          categories: ['essential'],
          timestamp: Date.now(),
          version: consentVersion,
        }),
      )
      localStorage.setItem('display-options:v1', JSON.stringify({ cursorMode: cursor }))
      if (suppressStartup) {
        sessionStorage.setItem('managed-startup-opened:desktop', 'true')
        sessionStorage.setItem('managed-startup-opened:mobile', 'true')
      }
    },
    {
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
