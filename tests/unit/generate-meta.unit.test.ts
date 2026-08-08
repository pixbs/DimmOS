import { afterEach, describe, expect, it } from 'vitest'

import { generateMeta } from '@/utilities/generateMeta'

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
})

describe('page metadata generation', () => {
  it('uses CMS overrides and an uploaded social image', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.test'
    expect(
      generateMeta({
        title: 'Fallback title',
        slug: 'work',
        meta: {
          title: 'Search title',
          description: 'Search description',
          image: { url: 'https://cdn.example.test/social.jpg' },
          noIndex: true,
        },
      }),
    ).toEqual({
      title: 'Search title',
      description: 'Search description',
      alternates: { canonical: 'https://example.test/work' },
      openGraph: {
        title: 'Search title',
        description: 'Search description',
        images: [{ url: 'https://cdn.example.test/social.jpg' }],
      },
      twitter: { card: 'summary_large_image' },
      robots: { index: false },
    })
  })

  it('builds a branded title and encoded generated-image fallback', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.test'
    const metadata = generateMeta({ title: 'About', slug: 'about me', meta: { image: 12 } })
    expect(metadata.title).toBe("About — Dimm's OS")
    expect(metadata.openGraph?.images).toEqual([{ url: 'https://example.test/og/about%20me' }])
  })

  it('returns safe site defaults without a document or configured origin', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(generateMeta(null)).toEqual({
      title: "Dimm's OS",
      description: undefined,
      openGraph: {
        title: "Dimm's OS",
        description: undefined,
        images: [{ url: '/og' }],
      },
      twitter: { card: 'summary_large_image' },
      robots: { index: true },
    })
  })
})
