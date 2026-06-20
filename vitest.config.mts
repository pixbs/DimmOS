import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // Let integration tests import server-only modules (e.g. lib/articleList)
      // in the node env without tripping the server-only client-import guard.
      'server-only': fileURLToPath(new URL('./tests/stubs/empty.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    pool: 'forks',
    maxWorkers: 1,
    minWorkers: 1,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.{ts,tsx}'],
    hookTimeout: 60000,
  },
})
