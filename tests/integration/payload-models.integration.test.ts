import type { User } from '@/payload-types'
import { describe, expect, it } from 'vitest'

import {
  getTestPayload,
  registerCleanup,
  trackDocument,
  uniqueValue,
} from '../fixtures/payload'

async function createAdmin(): Promise<User> {
  const payload = await getTestPayload()
  const user = await payload.create({
    collection: 'users',
    data: {
      email: `${uniqueValue('admin')}@example.test`,
      password: uniqueValue('password'),
    },
    overrideAccess: true,
  })
  await trackDocument('users', user.id)
  return user
}

describe('Payload models and access control', () => {
  it('serves cookie defaults publicly and restricts global updates to authenticated users', async () => {
    const payload = await getTestPayload()
    const original = await payload.findGlobal({
      slug: 'cookie-settings',
      overrideAccess: false,
    })
    expect(original).toMatchObject({
      title: 'We use cookies',
      consentVersion: '1.0',
    })

    await expect(
      payload.updateGlobal({
        slug: 'cookie-settings',
        data: { consentVersion: 'unauthorized' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const user = await createAdmin()
    registerCleanup(async () => {
      await payload.updateGlobal({
        slug: 'cookie-settings',
        data: {
          title: original.title,
          description: original.description,
          consentVersion: original.consentVersion,
        },
        overrideAccess: true,
      })
    })
    const updated = await payload.updateGlobal({
      slug: 'cookie-settings',
      data: { consentVersion: '2.1' },
      overrideAccess: false,
      user,
    })
    expect(updated.consentVersion).toBe('2.1')
  })

  it('applies window and SEO defaults and enforces required and unique fields', async () => {
    const payload = await getTestPayload()
    const slug = uniqueValue('window-defaults')
    const window = await payload.create({
      collection: 'windows',
      data: { title: 'Defaults contract', slug },
      overrideAccess: true,
    })
    await trackDocument('windows', window.id)

    expect(window).toMatchObject({
      slug,
      windowCollapsible: true,
      windowExpandable: false,
      windowResizable: true,
      windowDefaultView: 'grid',
      windowOpenOnStartup: false,
      windowStartupViewports: ['desktop'],
      windowStartupOrder: 0,
      meta: { noIndex: false },
    })

    await expect(
      payload.create({
        collection: 'windows',
        data: { title: 'Duplicate slug', slug },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'windows',
        data: { slug: uniqueValue('missing-title') } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('persists article relationships and resolves them for public reads', async () => {
    const payload = await getTestPayload()
    const tag = await payload.create({
      collection: 'tags',
      data: { title: 'Integration tag', slug: uniqueValue('tag') },
      overrideAccess: true,
    })
    await trackDocument('tags', tag.id)
    const article = await payload.create({
      collection: 'articles',
      data: {
        title: 'Relationship contract',
        type: 'case-study',
        slug: uniqueValue('article'),
        year: 2026,
        tags: [tag.id],
        content: [{ blockType: 'hero', title: 'A real case study' }],
      },
      overrideAccess: true,
    })
    await trackDocument('articles', article.id)

    const publicArticle = await payload.findByID({
      collection: 'articles',
      id: article.id,
      depth: 1,
      overrideAccess: false,
    })
    expect(publicArticle.content?.[0]).toMatchObject({
      blockType: 'hero',
      title: 'A real case study',
    })
    expect(publicArticle.tags?.[0]).toMatchObject({ id: tag.id, title: 'Integration tag' })
  })

  it('allows authenticated writes and rejects anonymous mutations on protected content', async () => {
    const payload = await getTestPayload()
    const user = await createAdmin()
    const cases = [
      {
        collection: 'windows' as const,
        data: { title: 'Protected window', slug: uniqueValue('protected-window') },
      },
      {
        collection: 'articles' as const,
        data: {
          title: 'Protected article',
          type: 'service' as const,
          slug: uniqueValue('protected-article'),
        },
      },
      {
        collection: 'tags' as const,
        data: { title: 'Protected tag', slug: uniqueValue('protected-tag') },
      },
      {
        collection: 'cookie-services' as const,
        data: { name: 'Protected service', category: 'functional' as const },
      },
    ]

    for (const testCase of cases) {
      await expect(
        payload.create({
          collection: testCase.collection,
          data: testCase.data,
          overrideAccess: false,
        } as never),
      ).rejects.toThrow()

      const document = await payload.create({
        collection: testCase.collection,
        data: testCase.data,
        overrideAccess: false,
        user,
      } as never)
      await trackDocument(testCase.collection, document.id)
      const found = await payload.findByID({
        collection: testCase.collection,
        id: document.id,
        overrideAccess: false,
      })
      expect(found.id).toBe(document.id)
      await expect(
        payload.update({
          collection: testCase.collection,
          id: document.id,
          data: testCase.data,
          overrideAccess: false,
        } as never),
      ).rejects.toThrow()
      await expect(
        payload.delete({
          collection: testCase.collection,
          id: document.id,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    }
  })
})
