import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../../src/payload.config.js'

// Drizzle's hanji spinner writes each frame as a new line in non-TTY environments.
// Intercept stdout to drop the intermediate frames; only the final [✓] line passes through.
const DRIZZLE_SPINNER_RE = /\[[⣷⣯⣟⡿⢿⣻⣽⣾]\]/u
const _stdoutWrite = process.stdout.write.bind(process.stdout)
// @ts-ignore
process.stdout.write = (...args: Parameters<typeof process.stdout.write>): boolean => {
  const chunk = args[0]
  const str = typeof chunk === 'string' ? chunk : Buffer.from(chunk as Uint8Array).toString('utf8')
  if (DRIZZLE_SPINNER_RE.test(str)) {
    const cb = typeof args[1] === 'function' ? args[1] : typeof args[2] === 'function' ? args[2] : undefined
    cb?.()
    return true
  }
  return _stdoutWrite(...args)
}

export async function seedWindow(slug: string) {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'windows', where: { slug: { equals: slug } }, overrideAccess: true })
  return payload.create({
    collection: 'windows',
    overrideAccess: true,
    data: {
      title: `E2E ${slug}`,
      slug,
      showShortcut: true,
      content: [
        {
          blockType: 'richText',
          content: {
            root: {
              type: 'root',
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  version: 1,
                  children: [{ type: 'text', version: 1, text: 'E2E test content' }],
                },
              ],
            },
          },
        },
      ],
    },
  })
}

export async function cleanupWindow(slug: string) {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'windows', where: { slug: { equals: slug } }, overrideAccess: true })
}

export async function seedWindowWithBehavior(
  slug: string,
  behavior: {
    windowCollapsible?: boolean
    windowExpandable?: boolean
    windowResizable?: boolean
  },
) {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'windows', where: { slug: { equals: slug } }, overrideAccess: true })
  return payload.create({
    collection: 'windows',
    overrideAccess: true,
    data: {
      title: `E2E ${slug}`,
      slug,
      content: [],
      ...behavior,
    },
  })
}

export async function seedArticle(slug: string) {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'articles', where: { slug: { equals: slug } }, overrideAccess: true })
  return payload.create({
    collection: 'articles',
    overrideAccess: true,
    data: {
      title: `E2E ${slug}`,
      type: 'case-study',
      slug,
    },
  })
}

export async function cleanupArticle(slug: string) {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'articles', where: { slug: { equals: slug } }, overrideAccess: true })
}

export async function seedWorks() {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'windows', where: { slug: { equals: 'e2e-test-works' } }, overrideAccess: true })
  return payload.create({
    collection: 'windows',
    overrideAccess: true,
    data: {
      title: 'E2E Works',
      slug: 'e2e-test-works',
      content: [
        {
          blockType: 'articleList',
          types: ['case-study'],
          sortField: 'createdAt',
          sortDirection: 'desc',
          limit: 10,
        },
      ],
    },
  })
}

export async function cleanupWorks() {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'windows', where: { slug: { equals: 'e2e-test-works' } }, overrideAccess: true })
}

export type ToolbarOptions = {
  windowDisplaySearch?: boolean
  windowDisplayViewToggle?: boolean
  windowDefaultView?: 'grid' | 'table'
  windowDisplayHistory?: boolean
}

export async function seedToolbarWindow(slug: string, toolbar: ToolbarOptions = {}) {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'windows', where: { slug: { equals: slug } }, overrideAccess: true })
  return payload.create({
    collection: 'windows',
    overrideAccess: true,
    data: {
      title: `E2E ${slug}`,
      slug,
      showShortcut: false,
      content: [
        {
          blockType: 'richText',
          content: {
            root: {
              type: 'root', direction: 'ltr', format: '', indent: 0, version: 1,
              children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Toolbar test content' }] }],
            },
          },
        },
      ],
      ...toolbar,
    },
  })
}

export async function cleanupToolbarWindow(slug: string) {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'windows', where: { slug: { equals: slug } }, overrideAccess: true })
}

export async function seedArticleListWindow(
  windowSlug: string,
  articleSlugs: string[],
  toolbar: ToolbarOptions = {},
) {
  const payload = await getPayload({ config })
  // Wipe all e2e articles first — catches stale slugs from previous interrupted runs
  await payload.delete({ collection: 'articles', where: { slug: { contains: 'e2e-' } }, overrideAccess: true })
  // Seed articles
  for (const slug of articleSlugs) {
    await payload.create({
      collection: 'articles',
      overrideAccess: true,
      data: {
        title: `E2E Article ${slug}`,
        type: 'case-study',
        slug,
      },
    })
  }
  // Seed the window with articleList block
  await payload.delete({ collection: 'windows', where: { slug: { equals: windowSlug } }, overrideAccess: true })
  return payload.create({
    collection: 'windows',
    overrideAccess: true,
    data: {
      title: `E2E ${windowSlug}`,
      slug: windowSlug,
      showShortcut: false,
      content: [
        {
          blockType: 'articleList',
          heading: 'Projects',
          types: ['case-study'],
          sortField: 'createdAt',
          sortDirection: 'desc',
          limit: 20,
        },
      ],
      ...toolbar,
    },
  })
}

export async function cleanupArticleListWindow(windowSlug: string, articleSlugs: string[]) {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'windows', where: { slug: { equals: windowSlug } }, overrideAccess: true })
  for (const slug of articleSlugs) {
    await payload.delete({ collection: 'articles', where: { slug: { equals: slug } }, overrideAccess: true })
  }
}

// ─── Case-study seed (QA + block-preview generation) ───

type SeedPayload = Awaited<ReturnType<typeof getPayload>>

/** Build a minimal Lexical richText value wrapping a single paragraph. */
function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', version: 1, text }],
        },
      ],
    },
  }
}

/** Create a solid-colour 16:9 PNG media doc via sharp (no asset files to commit). */
async function createSolidImage(
  payload: SeedPayload,
  name: string,
  alt: string,
  rgba: { r: number; g: number; b: number; alpha?: number },
) {
  const data = await sharp({
    create: { width: 1600, height: 900, channels: 4, background: { alpha: 1, ...rgba } },
  })
    .png()
    .toBuffer()
  return payload.create({
    collection: 'media',
    overrideAccess: true,
    data: { alt },
    file: { data, name, mimetype: 'image/png', size: data.length },
  })
}

/** Remove everything created by {@link seedCaseStudy} for `slug` (idempotent). */
export async function cleanupCaseStudy(slug: string) {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'articles', where: { slug: { contains: slug } }, overrideAccess: true })
  await payload.delete({ collection: 'tags', where: { slug: { contains: `${slug}-tag` } }, overrideAccess: true })
  await payload.delete({ collection: 'media', where: { filename: { contains: `${slug}-` } }, overrideAccess: true })
}

/**
 * Seed a full case-study article exercising every section block (Hero, Summary,
 * Stats, Image, Description, Title) plus a Works list of sibling case studies —
 * for hand QA and for generating the admin block previews.
 *
 * Generates its own bg/fg/section images (sharp), tags, and three sibling case
 * studies (two with cover images, one icon-only) so the Works grid shows both
 * image cards and the icon fallback, and the table shows tags/year. Idempotent.
 *
 * @param slug - Slug of the main case study; siblings/tags/media are namespaced under it.
 * @returns The created main article document.
 */
export async function seedCaseStudy(slug: string) {
  const payload = await getPayload({ config })
  await cleanupCaseStudy(slug)

  const [bg, fg, sectionImg, w1bg, w2bg] = await Promise.all([
    createSolidImage(payload, `${slug}-bg.png`, 'Hero background layer', { r: 34, g: 60, b: 120 }),
    createSolidImage(payload, `${slug}-fg.png`, 'Hero foreground layer', { r: 242, g: 47, b: 87, alpha: 0.6 }),
    createSolidImage(payload, `${slug}-section.png`, 'Full-width section image', { r: 20, g: 90, b: 70 }),
    createSolidImage(payload, `${slug}-w1.png`, 'Northwind cover', { r: 120, g: 80, b: 200 }),
    createSolidImage(payload, `${slug}-w2.png`, 'Lumen cover', { r: 200, g: 140, b: 40 }),
  ])

  const [tBrand, tWeb, tMotion] = await Promise.all([
    payload.create({ collection: 'tags', overrideAccess: true, data: { title: 'Branding', slug: `${slug}-tag-branding` } }),
    payload.create({ collection: 'tags', overrideAccess: true, data: { title: 'Web', slug: `${slug}-tag-web` } }),
    payload.create({ collection: 'tags', overrideAccess: true, data: { title: 'Motion', slug: `${slug}-tag-motion` } }),
  ])

  // Sibling case studies surfaced by the main article's Works section.
  await payload.create({
    collection: 'articles',
    overrideAccess: true,
    data: { title: 'Northwind Rebrand', type: 'case-study', slug: `${slug}-w1`, year: 2024, tags: [tBrand.id, tMotion.id], bgImage: w1bg.id },
  })
  await payload.create({
    collection: 'articles',
    overrideAccess: true,
    data: { title: 'Lumen Platform', type: 'case-study', slug: `${slug}-w2`, year: 2025, tags: [tWeb.id], bgImage: w2bg.id },
  })
  await payload.create({
    collection: 'articles',
    overrideAccess: true,
    data: { title: 'Quiet Hours App', type: 'case-study', slug: `${slug}-w3`, year: 2023, tags: [tMotion.id], shortcutIcon: 'ri-moon-fill' },
  })

  return payload.create({
    collection: 'articles',
    overrideAccess: true,
    data: {
      title: 'Acme Field Guide',
      type: 'case-study',
      slug,
      year: 2026,
      tags: [tBrand.id, tWeb.id, tMotion.id],
      bgImage: bg.id,
      fgImage: fg.id,
      showShortcut: true,
      shortcutName: 'Case Study',
      shortcutIcon: 'ri-booklet-fill',
      windowDisplayViewToggle: true,
      windowDisplaySearch: true,
      content: [
        {
          blockType: 'hero',
          title: 'Acme Field Guide',
          description: 'A complete rebrand and product system for a modern field-services company.',
        },
        {
          blockType: 'summary',
          leftTitle: 'Overview',
          leftBody: 'A focused engagement across brand and product, delivered in three phases.',
          rightTitle: 'What we did',
          rightBody: 'Identity, a design system, the marketing site, and a member dashboard.',
        },
        {
          blockType: 'stats',
          stats: [
            { value: 10, suffix: 'Mil', label: 'Impressions in launch month' },
            { value: 98, suffix: '%', label: 'Customer satisfaction' },
            { value: 3, suffix: 'x', label: 'Faster onboarding' },
          ],
        },
        { blockType: 'imageSection', image: sectionImg.id },
        {
          blockType: 'description',
          title: 'The approach',
          body: lexicalParagraph(
            'We started from the brand foundations and worked outward to a cohesive product system, validating each phase with real users.',
          ),
        },
        { blockType: 'sectionTitle', title: 'Selected Works', description: 'A few related projects from the same era.' },
        { blockType: 'articleList', heading: 'Related work', types: ['case-study'], sortField: 'createdAt', sortDirection: 'desc', limit: 12 },
      ],
    },
  })
}
