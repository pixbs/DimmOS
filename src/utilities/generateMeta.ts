import type { Metadata } from 'next'

const SITE_TITLE = "Dimm's OS"

type MetaDoc = {
  title?: string | null
  slug?: string | null
  meta?: {
    title?: string | null
    description?: string | null
    image?: { url?: string | null } | number | null
    noIndex?: boolean | null
  } | null
}

function createPageTitle(doc: MetaDoc | null): string {
  if (doc?.meta?.title) return doc.meta.title
  if (doc?.title) return `${doc.title} \u2014 ${SITE_TITLE}`
  return SITE_TITLE
}

function createFallbackOgImageUrl(doc: MetaDoc | null, base: string): string {
  if (!doc?.slug) return `${base}/og`
  return `${base}/og/${encodeURIComponent(doc.slug)}`
}

export function generateMeta(doc: MetaDoc | null): Metadata {
  const title = createPageTitle(doc)
  const description = doc?.meta?.description || undefined
  const image = doc?.meta?.image
  const ogImageUrl = image && typeof image !== 'number' ? image.url ?? undefined : undefined

  // Relative canonical falls back to Next's metadataBase resolution when
  // NEXT_PUBLIC_SITE_URL is unset (e.g. local dev).
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const openGraphImages = [{ url: ogImageUrl ?? createFallbackOgImageUrl(doc, base) }]

  return {
    title,
    description,
    ...(doc?.slug ? { alternates: { canonical: `${base}/${doc.slug}` } } : {}),
    openGraph: {
      title: title ?? undefined,
      description: description ?? undefined,
      images: openGraphImages,
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: !doc?.meta?.noIndex },
  }
}
