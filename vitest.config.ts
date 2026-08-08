import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, defineProject } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

const coverageModules = [
  'src/fields/ai-generation.ts',
  'src/fields/slugField.ts',
  'src/components/content-blocks/sections/welcome-title.ts',
  'src/components/window/footer-button.ts',
  'src/lib/breakpoints.ts',
  'src/lib/context-menu.ts',
  'src/lib/display-options.ts',
  'src/lib/easing.ts',
  'src/lib/parseStat.ts',
  'src/lib/pixelate.ts',
  'src/lib/seo-image/media.ts',
  'src/lib/seo-image/signature.ts',
  'src/lib/shortcut-positions.ts',
  'src/lib/splitText.ts',
  'src/lib/utils.ts',
  'src/lib/window-positions.ts',
  'src/lib/window-state.ts',
  'src/utilities/generateMeta.ts',
  'src/utilities/windowBehavior.ts',
]

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    allowOnly: false,
    passWithNoTests: false,
    reporters: ['default', ['junit', { outputFile: 'artifacts/vitest/junit.xml' }]],
    coverage: {
      provider: 'v8',
      include: coverageModules,
      exclude: [
        'src/payload-types.ts',
        'src/payload-generated-schema.ts',
        'src/migrations/**',
        'src/scripts/**',
        'tests/**',
      ],
      reporter: ['text-summary', 'json', 'html', 'lcov'],
      reportsDirectory: 'artifacts/coverage',
      thresholds: {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    projects: [
      defineProject({
        plugins: [tsconfigPaths()],
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.unit.test.{ts,tsx}'],
          setupFiles: ['./tests/setup/unit.setup.ts'],
        },
      }),
      defineProject({
        plugins: [tsconfigPaths(), react()],
        test: {
          name: 'component',
          include: ['tests/component/**/*.component.test.tsx'],
          setupFiles: ['./tests/setup/component.setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      }),
      defineProject({
        plugins: [tsconfigPaths(), react()],
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.integration.test.{ts,tsx}'],
          maxWorkers: 1,
          setupFiles: ['./tests/setup/integration.setup.ts'],
        },
      }),
    ],
  },
})
