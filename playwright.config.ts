import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'artifacts/playwright/results',
  forbidOnly: true,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['line'],
    ['junit', { outputFile: 'artifacts/playwright/junit.xml' }],
    ['html', { outputFolder: 'artifacts/playwright/html', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], browserName: 'chromium' },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'bun run start',
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
})
