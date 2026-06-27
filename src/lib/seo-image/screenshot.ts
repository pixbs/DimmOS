import { existsSync } from 'node:fs'
import { mkdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
const SERVERLESS_CHROMIUM_LOCK_DIR = join(tmpdir(), 'seo-image-chromium.lock')
const SERVERLESS_CHROMIUM_PATH = join(tmpdir(), 'chromium')
const SERVERLESS_CHROMIUM_LOCK_STALE_MS = 60_000
const SERVERLESS_CHROMIUM_LOCK_WAIT_MS = 60_000
const SERVERLESS_LAUNCH_RETRY_DELAYS_MS = [250, 750, 1500] as const
const PLAYWRIGHT_SAFE_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'] as const

let serverlessExecutablePathPromise: Promise<string | undefined> | null = null

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined
  }

  return typeof error.code === 'string' ? error.code : undefined
}

function isRetryableLaunchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('ETXTBSY') || message.includes('Text file busy')
}

async function isServerlessChromiumLockStale(): Promise<boolean> {
  try {
    const lockStats = await stat(SERVERLESS_CHROMIUM_LOCK_DIR)
    return Date.now() - lockStats.mtimeMs > SERVERLESS_CHROMIUM_LOCK_STALE_MS
  } catch {
    return false
  }
}

async function tryAcquireServerlessChromiumLock(): Promise<boolean> {
  try {
    await mkdir(SERVERLESS_CHROMIUM_LOCK_DIR)
    return true
  } catch (error) {
    if (getErrorCode(error) === 'EEXIST') {
      return false
    }

    throw error
  }
}

async function waitForServerlessChromiumLock(): Promise<void> {
  const startedAt = Date.now()

  while (existsSync(SERVERLESS_CHROMIUM_LOCK_DIR)) {
    if (await isServerlessChromiumLockStale()) {
      await rm(SERVERLESS_CHROMIUM_LOCK_DIR, { force: true, recursive: true })
      return
    }

    if (Date.now() - startedAt > SERVERLESS_CHROMIUM_LOCK_WAIT_MS) {
      throw new Error('Timed out waiting for serverless Chromium extraction lock.')
    }

    await sleep(100)
  }
}

async function withServerlessChromiumExtractionLock<T>(task: () => Promise<T>): Promise<T> {
  while (!(await tryAcquireServerlessChromiumLock())) {
    await waitForServerlessChromiumLock()
  }

  try {
    return await task()
  } finally {
    await rm(SERVERLESS_CHROMIUM_LOCK_DIR, { force: true, recursive: true })
  }
}

async function getServerlessExecutablePath(
  serverlessChromium: ServerlessChromium,
): Promise<string | undefined> {
  serverlessExecutablePathPromise ??= withServerlessChromiumExtractionLock(async () => {
    if (existsSync(SERVERLESS_CHROMIUM_PATH)) {
      return SERVERLESS_CHROMIUM_PATH
    }

    return serverlessChromium.executablePath?.()
  }).catch((error) => {
    serverlessExecutablePathPromise = null
    throw error
  })

  return serverlessExecutablePathPromise
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
    const executablePath = serverlessChromium
      ? await getServerlessExecutablePath(serverlessChromium)
      : undefined
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

async function launchBrowser(candidate: LaunchCandidate): Promise<Browser> {
  let lastError: unknown

  for (let attempt = 0; attempt <= SERVERLESS_LAUNCH_RETRY_DELAYS_MS.length; attempt += 1) {
    const delay = SERVERLESS_LAUNCH_RETRY_DELAYS_MS[attempt - 1]

    if (delay) {
      await sleep(delay)
    }

    try {
      return await chromium.launch(candidate.options)
    } catch (error) {
      lastError = error

      if (!isRetryableLaunchError(error)) {
        throw error
      }
    }
  }

  throw lastError
}

function getPreviewUrl(args: CaptureSeoPreviewScreenshotArgs): string {
  const origin = args.origin.replace(/\/$/, '')
  return `${origin}/seo-preview/${args.source.collection}/${args.source.id}`
}

function getLaunchFailureHint(): string {
  if (isLikelyServerlessRuntime()) {
    return ' Check @sparticuz/chromium bundling and serverless /tmp extraction, or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.'
  }

  return ' Run "bunx playwright install chromium" for local dev or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.'
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
        browser = await launchBrowser(candidate)
        break
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        launchFailures.push(`${candidate.label}: ${message.split('\n')[0]}`)
      }
    }

    if (!browser) {
      const details = launchFailures.length ? ` Tried ${launchFailures.join('; ')}.` : ''
      throw new Error(
        `Unable to launch Chromium for SEO image capture.${details}${getLaunchFailureHint()}`,
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
