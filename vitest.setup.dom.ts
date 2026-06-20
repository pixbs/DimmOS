// Setup for jsdom-based unit + component tests.
//
// jsdom does not implement the browser observers/queries that Framer Motion and
// our scroll-animation hooks rely on, so we provide minimal mocks: an
// IntersectionObserver that immediately reports its target as visible (so
// in-view-gated animations actually run during tests), a no-op ResizeObserver,
// and a default matchMedia (reduced-motion off). DOM is cleaned up after each test.
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  private callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(target: Element): void {
    this.callback(
      [{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry],
      this,
    )
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver

class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

afterEach(() => {
  cleanup()
})
