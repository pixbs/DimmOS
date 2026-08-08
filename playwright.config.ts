import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
const mobileViewport = {
  deviceScaleFactor: 2,
  viewport: { height: 915, width: 412 },
}

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'artifacts/playwright/results',
  expect: { timeout: 15_000 },
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
  },
  projects: [
    {
      name: 'chromium-desktop',
      testMatch: '**/*.desktop.e2e.test.ts',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        launchOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      },
    },
    {
      name: 'chromium-mobile',
      testMatch: '**/*.mobile.e2e.test.ts',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
        launchOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      },
    },
    {
      name: 'firefox-desktop',
      testMatch: '**/*.desktop.e2e.test.ts',
      use: { ...devices['Desktop Firefox'], browserName: 'firefox' },
    },
    {
      name: 'firefox-mobile',
      testMatch: '**/*.mobile.e2e.test.ts',
      use: { ...mobileViewport, browserName: 'firefox' },
    },
    {
      name: 'webkit-desktop',
      testMatch: '**/*.desktop.e2e.test.ts',
      use: { ...devices['Desktop Safari'], browserName: 'webkit' },
    },
    {
      name: 'webkit-mobile',
      testMatch: '**/*.mobile.e2e.test.ts',
      use: { ...mobileViewport, browserName: 'webkit' },
    },
  ],
  webServer: {
    command: 'bun run start',
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
})
