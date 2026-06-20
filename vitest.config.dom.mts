import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'

// jsdom config for fast, in-process tests:
//  - tests/unit/**       pure-logic unit tests (no DOM needed, but harmless under jsdom)
//  - tests/component/**  React component tests via @testing-library/react
// Real-browser behaviour (canvas pixelation, IntersectionObserver scrolling,
// mouse-follow hover) is covered by Playwright e2e instead — jsdom can't run it.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // Render a plain <img> instead of pulling Next's image-optimization runtime.
      'next/image': fileURLToPath(new URL('./tests/stubs/next-image.tsx', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.dom.ts'],
    include: [
      'tests/unit/**/*.unit.spec.{ts,tsx}',
      'tests/component/**/*.component.spec.{ts,tsx}',
    ],
  },
})
