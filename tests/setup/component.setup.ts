import { afterEach } from 'vitest'
import { cleanup } from 'vitest-browser-react'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.sessionStorage.clear()
})
