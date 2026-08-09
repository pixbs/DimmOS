import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from 'vitest-browser-react'

import { browserWorker } from '../mocks/browser'
import '@/app/(frontend)/styles.css'

beforeAll(async () => {
  await browserWorker.start({
    onUnhandledRequest(request, print) {
      const url = new URL(request.url)
      if (url.pathname.startsWith('/@') || url.pathname.startsWith('/__vitest__')) return
      print.error()
      throw new Error(`Unhandled request in component test: ${request.method} ${request.url}`)
    },
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
})

afterEach(async () => {
  await cleanup()
  browserWorker.resetHandlers()
  window.localStorage.clear()
  window.sessionStorage.clear()
  window.history.replaceState({}, '', '/')
  delete document.documentElement.dataset.dimmCursor
  delete window.gtag
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

afterAll(() => {
  browserWorker.stop()
})
