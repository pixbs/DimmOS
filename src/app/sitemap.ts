import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  const [windows, articles] = await Promise.all([
    payload.find({
      collection: 'windows',
      where: { 'meta.noIndex': { not_equals: true } },
      select: { slug: true, updatedAt: true } as const,
      limit: 200,
      depth: 0,
    }),
    payload.find({
      collection: 'articles',
      where: { 'meta.noIndex': { not_equals: true } },
      select: { slug: true, updatedAt: true } as const,
      limit: 200,
      depth: 0,
    }),
  ])

  return [
    { url: base || '/', lastModified: new Date() },
    ...windows.docs.map((d) => ({
      url: `${base}/${d.slug}`,
      lastModified: new Date(d.updatedAt),
    })),
    ...articles.docs.map((d) => ({
      url: `${base}/${d.slug}`,
      lastModified: new Date(d.updatedAt),
    })),
  ]
}
