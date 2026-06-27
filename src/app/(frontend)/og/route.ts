import {
  FALLBACK_OG_CONTENT_TYPE,
  FALLBACK_OG_SIZE,
  createFallbackOgImage,
  createFallbackOgTitle,
} from '@/lib/og/fallback-og-image'

export const dynamic = 'force-dynamic'
export const contentType = FALLBACK_OG_CONTENT_TYPE
export const size = FALLBACK_OG_SIZE

export function GET() {
  return createFallbackOgImage(createFallbackOgTitle())
}
