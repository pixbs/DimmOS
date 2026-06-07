import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

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
      showShortcut: true,
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
  // Seed articles first
  for (const slug of articleSlugs) {
    await payload.delete({ collection: 'articles', where: { slug: { equals: slug } }, overrideAccess: true })
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
      showShortcut: true,
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
