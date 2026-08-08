import { expect, test as base } from '@playwright/test'

import { E2E_ORIGIN } from '../fixtures/e2e-values'

type Guardrails = {
  allowBrowserMessage: (pattern: RegExp) => void
}

type GuardrailFixtures = {
  testGuardrails: Guardrails
}

export const test = base.extend<GuardrailFixtures>({
  testGuardrails: [
    async ({ page }, use) => {
      const allowedBrowserMessages: RegExp[] = []
      const browserMessages: string[] = []
      const pageErrors: string[] = []
      const unexpectedRequests: string[] = []
      const applicationOrigin = new URL(E2E_ORIGIN).origin

      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') {
          browserMessages.push(`${message.type()}: ${message.text()}`)
        }
      })
      page.on('pageerror', (error) => {
        pageErrors.push(error.message)
      })

      await page.route('**/*', async (route) => {
        const request = route.request()
        const url = new URL(request.url())
        if (!['http:', 'https:'].includes(url.protocol) || url.origin === applicationOrigin) {
          await route.continue()
          return
        }

        unexpectedRequests.push(`${request.method()} ${url.href}`)
        await route.abort('blockedbyclient')
      })

      await use({
        allowBrowserMessage(pattern) {
          allowedBrowserMessages.push(pattern)
        },
      })

      const unexpectedBrowserMessages = browserMessages.filter(
        (message) => !allowedBrowserMessages.some((pattern) => pattern.test(message)),
      )
      expect(unexpectedRequests, 'unexpected external browser requests').toEqual([])
      expect(pageErrors, 'uncaught browser errors').toEqual([])
      expect(unexpectedBrowserMessages, 'browser console warnings and errors').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
