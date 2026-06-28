import { getPayload } from 'payload'
import config from '@payload-config'

import {
  FALLBACK_OG_CONTENT_TYPE,
  FALLBACK_OG_SIZE,
  createFallbackOgImage,
  createFallbackOgTitle,
} from '@/lib/og/fallback-og-image'

type PageProps = {
  params: Promise<{ slug: string }>
}

type OgDoc = {
  title?: string | null
  slug?: string | null
  meta?: { title?: string | null } | null
}

export const dynamic = 'force-dynamic'
export const contentType = FALLBACK_OG_CONTENT_TYPE
export const size = FALLBACK_OG_SIZE

export async function GET(_request: Request, { params }: PageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const select = { title: true, slug: true, meta: true } as const
  const [{ docs: windows }, { docs: articles }] = await Promise.all([
    payload.find({
      collection: 'windows',
      where: { slug: { equals: slug } },
      select,
      limit: 1,
      depth: 0,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'articles',
      where: { slug: { equals: slug } },
      select,
      limit: 1,
      depth: 0,
      overrideAccess: false,
    }),
  ])

  const doc = (windows[0] ?? articles[0] ?? null) as OgDoc | null
  if (!doc) return new Response('Not found', { status: 404 })

  return createFallbackOgImage(createFallbackOgTitle(doc))
}
