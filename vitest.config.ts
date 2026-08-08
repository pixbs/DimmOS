import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { fileURLToPath } from 'node:url'
import { defineConfig, defineProject } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

const coverageModules = [
  'src/collections/Articles.ts',
  'src/collections/CookieConsents.ts',
  'src/collections/CookieServices.ts',
  'src/collections/Media.ts',
  'src/collections/Tags.ts',
  'src/collections/Users.ts',
  'src/collections/Windows.ts',
  'src/components/animation/animated-divider.tsx',
  'src/components/animation/animated-text.tsx',
  'src/components/content-blocks/sections/image-section.tsx',
  'src/components/content-blocks/sections/section-title.tsx',
  'src/components/content-blocks/sections/stats.tsx',
  'src/components/content-blocks/sections/summary.tsx',
  'src/components/content-blocks/sections/welcome-intro.tsx',
  'src/components/content-blocks/works/item-link.tsx',
  'src/components/content-blocks/works/works-grid.tsx',
  'src/components/shortcut/registry-context.tsx',
  'src/components/window/content-error-boundary.tsx',
  'src/components/window/title-bar.tsx',
  'src/components/window/window-scaffold.tsx',
  'src/fields/ai-generation.ts',
  'src/fields/slugField.ts',
  'src/globals/CookieSettings.ts',
  'src/hooks/cookies/captureRequestMetadata.ts',
  'src/hooks/forms/enforcePreDefinedEmail.ts',
  'src/hooks/forms/verifyRecaptcha.ts',
  'src/hooks/revalidateContent.ts',
  'src/hooks/seo/generated-meta-image.ts',
  'src/endpoints/ai-generate-field.ts',
  'src/components/content-blocks/sections/welcome-title.ts',
  'src/components/window/footer-button.ts',
  'src/lib/breakpoints.ts',
  'src/lib/articleList.ts',
  'src/lib/context-menu.ts',
  'src/lib/display-options.ts',
  'src/lib/easing.ts',
  'src/lib/parseStat.ts',
  'src/lib/pixelate.ts',
  'src/lib/seo-image/media.ts',
  'src/lib/seo-image/generation.ts',
  'src/lib/seo-image/signature.ts',
  'src/lib/shortcut-positions.ts',
  'src/lib/splitText.ts',
  'src/lib/utils.ts',
  'src/lib/window-positions.ts',
  'src/lib/window-state.ts',
  'src/lib/windowContent.ts',
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
        resolve: {
          alias: [
            {
              find: /^server-only$/,
              replacement: fileURLToPath(new URL('./tests/stubs/empty.ts', import.meta.url)),
            },
          ],
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.unit.test.{ts,tsx}'],
          setupFiles: ['./tests/setup/unit.setup.ts'],
        },
      }),
      defineProject({
        plugins: [tsconfigPaths(), react()],
        define: {
          'process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY': JSON.stringify(''),
        },
        optimizeDeps: {
          include: ['framer-motion'],
        },
        resolve: {
          alias: [
            {
              find: /^@payloadcms\/ui$/,
              replacement: fileURLToPath(
                new URL('./tests/stubs/browser-payload-ui.ts', import.meta.url),
              ),
            },
            {
              find: /^@\/actions\/getWindowContent$/,
              replacement: fileURLToPath(
                new URL('./tests/stubs/browser-window-content-action.ts', import.meta.url),
              ),
            },
            {
              find: /^next\/image$/,
              replacement: fileURLToPath(new URL('./tests/stubs/browser-image.tsx', import.meta.url)),
            },
            {
              find: /^next\/link$/,
              replacement: fileURLToPath(new URL('./tests/stubs/browser-link.tsx', import.meta.url)),
            },
            {
              find: /^next\/navigation$/,
              replacement: fileURLToPath(
                new URL('./tests/stubs/browser-navigation.ts', import.meta.url),
              ),
            },
            {
              find: /^payload\/shared$/,
              replacement: fileURLToPath(
                new URL('./tests/stubs/browser-payload-shared.ts', import.meta.url),
              ),
            },
          ],
        },
        test: {
          name: 'component',
          include: ['tests/component/**/*.component.test.tsx'],
          setupFiles: ['./tests/setup/component.setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            screenshotDirectory: 'artifacts/vitest/screenshots',
            instances: [
              {
                browser: 'chromium',
                viewport: { width: 1280, height: 900 },
              },
            ],
          },
        },
      }),
      defineProject({
        plugins: [tsconfigPaths(), react()],
        resolve: {
          alias: [
            {
              find: /^@anthropic-ai\/sdk$/,
              replacement: fileURLToPath(
                new URL('./tests/stubs/node-anthropic.ts', import.meta.url),
              ),
            },
            {
              find: /^next\/cache$/,
              replacement: fileURLToPath(
                new URL('./tests/stubs/node-next-cache.ts', import.meta.url),
              ),
            },
            {
              find: /^next\/server$/,
              replacement: fileURLToPath(
                new URL('./tests/stubs/node-next-server.ts', import.meta.url),
              ),
            },
            {
              find: /^server-only$/,
              replacement: fileURLToPath(new URL('./tests/stubs/empty.ts', import.meta.url)),
            },
          ],
        },
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.integration.test.{ts,tsx}'],
          isolate: false,
          maxWorkers: 1,
          sequence: { groupOrder: 1 },
          setupFiles: ['./tests/setup/integration.setup.ts'],
        },
      }),
    ],
  },
})
