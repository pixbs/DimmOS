import 'dotenv/config'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { seedCaseStudy, cleanupCaseStudy } from '../../tests/helpers/seedContent.js'

/**
 * Generate the admin block-selection previews.
 *
 * Seeds a throwaway case study, opens it on the running dev server with reduced
 * motion (so animations/de-pixelation settle), screenshots each rendered
 * `[data-block-type]` section, and writes `public/block-previews/<slug>.png` —
 * the images referenced by each block's `imageURL`. Cleans up the seed after.
 *
 * Prerequisite: the dev server must be running (`bun dev`). Override the URL
 * with BASE_URL if needed.
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const SLUG = 'block-preview-source'
const OUT_DIR = path.resolve(process.cwd(), 'public', 'block-previews')

const BLOCK_TYPES = [
  'hero',
  'welcomeIntro',
  'interactivePortrait',
  'summary',
  'stats',
  'imageSection',
  'description',
  'sectionTitle',
  'articleList',
] as const

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  await seedCaseStudy(SLUG)

  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1400 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/${SLUG}`, { waitUntil: 'networkidle' })
    await page.locator('[data-block-type="hero"]').first().waitFor({ state: 'visible', timeout: 30000 })

    for (const blockType of BLOCK_TYPES) {
      const el = page.locator(`[data-block-type="${blockType}"]`).first()
      if ((await el.count()) === 0) {
        console.warn(`No rendered element for block "${blockType}" — skipping.`)
        continue
      }
      await el.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await el.screenshot({ path: path.join(OUT_DIR, `${blockType}.png`) })
      console.log(`Wrote ${blockType}.png`)
    }
  } finally {
    await browser.close()
    await cleanupCaseStudy(SLUG)
  }
  process.exit(0)
}

void main()
