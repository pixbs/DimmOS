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

export function generateMeta(doc: MetaDoc | null): Metadata {
  const title = doc?.meta?.title || (doc?.title ? `${doc.title} — ${SITE_TITLE}` : SITE_TITLE)
  const description = doc?.meta?.description || undefined
  const image = doc?.meta?.image
  const ogImageUrl = image && typeof image !== 'number' ? image.url ?? undefined : undefined

  // Relative canonical falls back to Next's metadataBase resolution when
  // NEXT_PUBLIC_SITE_URL is unset (e.g. local dev).
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  return {
    title,
    description,
    ...(doc?.slug ? { alternates: { canonical: `${base}/${doc.slug}` } } : {}),
    openGraph: {
      title: title ?? undefined,
      description: description ?? undefined,
      ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: !doc?.meta?.noIndex },
  }
}
