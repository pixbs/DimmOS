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
  await payload.delete({ collection: 'windows', where: { slug: { equals: 'works' } }, overrideAccess: true })
  return payload.create({
    collection: 'windows',
    overrideAccess: true,
    data: {
      title: 'Works',
      slug: 'works',
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
  await payload.delete({ collection: 'windows', where: { slug: { equals: 'works' } }, overrideAccess: true })
}
