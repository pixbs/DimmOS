import { chromium, type Browser, type LaunchOptions } from 'playwright-core'
import {
  SEO_IMAGE_HEIGHT,
  SEO_IMAGE_WIDTH,
  type SeoImageSource,
} from './types'

type ServerlessChromium = {
  args?: string[]
  executablePath?: () => Promise<string>
  headless?: boolean | 'shell'
}

type CaptureSeoPreviewScreenshotArgs = {
  origin: string
  source: SeoImageSource
}

type LaunchCandidate = {
  label: string
  options: LaunchOptions
}

const LAUNCH_TIMEOUT_MS = 10_000
const PLAYWRIGHT_SAFE_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'] as const

function isLikelyServerlessRuntime(): boolean {
  return (
    process.platform === 'linux' &&
    Boolean(process.env.VERCEL || process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME)
  )
}

async function getServerlessChromium(): Promise<ServerlessChromium | null> {
  try {
    const mod = await import('@sparticuz/chromium')
    return (mod.default ?? mod) as ServerlessChromium
  } catch {
    return null
  }
}

function createLaunchOptions(options: LaunchOptions): LaunchOptions {
  return {
    ...options,
    timeout: options.timeout ?? LAUNCH_TIMEOUT_MS,
  }
}

function normalizeArgs(args: string[] = []): string[] {
  return [...new Set([...args.filter((arg) => !arg.startsWith('--headless')), ...PLAYWRIGHT_SAFE_ARGS])]
}

function getLocalBrowserChannels(): string[] {
  return ['chromium']
}

async function getLaunchCandidates(): Promise<LaunchCandidate[]> {
  const executablePathFromEnv = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  if (executablePathFromEnv) {
    return [
      {
        label: 'PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH',
        options: createLaunchOptions({
          args: [...PLAYWRIGHT_SAFE_ARGS],
          executablePath: executablePathFromEnv,
          headless: true,
        }),
      },
    ]
  }

  if (isLikelyServerlessRuntime()) {
    const serverlessChromium = await getServerlessChromium()
    const executablePath = await serverlessChromium?.executablePath?.()
    const headless = typeof serverlessChromium?.headless === 'boolean' ? serverlessChromium.headless : true

    if (executablePath) {
      return [
        {
          label: '@sparticuz/chromium',
          options: createLaunchOptions({
            args: normalizeArgs(serverlessChromium?.args),
            executablePath,
            headless,
          }),
        },
      ]
    }
  }

  return getLocalBrowserChannels().map((channel) => ({
    label: `local ${channel}`,
    options: createLaunchOptions({
      args: [...PLAYWRIGHT_SAFE_ARGS],
      channel,
      headless: true,
    }),
  }))
}

function getPreviewUrl(args: CaptureSeoPreviewScreenshotArgs): string {
  const origin = args.origin.replace(/\/$/, '')
  return `${origin}/seo-preview/${args.source.collection}/${args.source.id}`
}

export async function captureSeoPreviewScreenshot(
  args: CaptureSeoPreviewScreenshotArgs,
): Promise<Buffer> {
  let browser: Browser | null = null

  try {
    const launchCandidates = await getLaunchCandidates()
    const launchFailures: string[] = []

    for (const candidate of launchCandidates) {
      try {
        browser = await chromium.launch(candidate.options)
        break
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        launchFailures.push(`${candidate.label}: ${message.split('\n')[0]}`)
      }
    }

    if (!browser) {
      const details = launchFailures.length ? ` Tried ${launchFailures.join('; ')}.` : ''
      throw new Error(
        `Unable to launch Chromium for SEO image capture.${details} Run "bunx playwright install chromium" for local dev or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.`,
      )
    }

    const page = await browser.newPage({
      deviceScaleFactor: 1,
      viewport: { width: SEO_IMAGE_WIDTH, height: SEO_IMAGE_HEIGHT },
    })

    page.setDefaultTimeout(30_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(getPreviewUrl(args), { waitUntil: 'networkidle' })
    await page.locator('[data-window-panel]').waitFor({ state: 'visible' })

    return await page.screenshot({
      fullPage: false,
      type: 'png',
    })
  } finally {
    await browser?.close()
  }
}
