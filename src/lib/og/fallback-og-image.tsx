import { ImageResponse } from 'next/og'

import { SEO_IMAGE_HEIGHT, SEO_IMAGE_WIDTH } from '@/lib/seo-image/types'

export const FALLBACK_OG_SIZE = {
  width: SEO_IMAGE_WIDTH,
  height: SEO_IMAGE_HEIGHT,
} as const

export const FALLBACK_OG_CONTENT_TYPE = 'image/png'

const SITE_TITLE = "Dimm's OS"

function clampTitle(title: string): string {
  const normalized = title.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 72) return normalized
  return `${normalized.slice(0, 69).trim()}...`
}

export function createFallbackOgTitle(doc?: {
  title?: string | null
  meta?: { title?: string | null } | null
} | null): string {
  if (doc?.meta?.title) return doc.meta.title
  if (doc?.title) return `${doc.title} \u2014 ${SITE_TITLE}`
  return SITE_TITLE
}

function TrafficLight({
  color,
  symbol,
}: {
  color: string
  symbol: string
}) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: color,
        borderRadius: 999,
        color: 'rgba(0, 0, 0, 0.42)',
        display: 'flex',
        fontSize: 13,
        fontWeight: 700,
        height: 16,
        justifyContent: 'center',
        lineHeight: 1,
        width: 16,
      }}
    >
      {symbol}
    </div>
  )
}

function FallbackOgFrame({ title }: { title: string }) {
  const displayTitle = clampTitle(title)

  return (
    <div
      style={{
        background: '#070707',
        color: 'white',
        display: 'flex',
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.10) 1px, transparent 1px), #070707',
          backgroundSize: '60px 60px',
          display: 'flex',
          height: '100%',
          opacity: 0.65,
          position: 'absolute',
          width: '100%',
        }}
      />
      <div
        style={{
          background: 'rgba(7, 7, 7, 0.60)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          height: 582,
          left: 40,
          padding: 8,
          position: 'absolute',
          top: 24,
          width: 1120,
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexShrink: 0,
            height: 36,
            padding: '0 12px',
            position: 'relative',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', gap: 4, zIndex: 1 }}>
            <TrafficLight color="#FF5F57" symbol="x" />
            <TrafficLight color="#FEBC2E" symbol="-" />
            <TrafficLight color="#28C840" symbol="+" />
          </div>
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.80)',
              fontSize: 14,
              left: 64,
              lineHeight: 1,
              overflow: 'hidden',
              position: 'absolute',
              right: 64,
              textAlign: 'center',
              textOverflow: 'ellipsis',
              top: 12,
              whiteSpace: 'nowrap',
            }}
          >
            {displayTitle}
          </div>
        </div>
        <div
          style={{
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.20)',
            display: 'flex',
            flexShrink: 0,
            gap: 8,
            height: 36,
            padding: '4px 8px',
            width: '100%',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 999,
              color: 'rgba(255, 255, 255, 0.45)',
              display: 'flex',
              flex: 1,
              fontSize: 13,
              height: 26,
              padding: '0 14px',
            }}
          >
            Search...
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, height: 26, width: 26 }} />
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 26, width: 26 }} />
          </div>
        </div>
        <div
          style={{
            alignItems: 'center',
            background: '#111111',
            borderRadius: 16,
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            minHeight: 0,
            padding: 72,
            width: '100%',
          }}
        >
          <div
            style={{
              color: 'white',
              display: 'flex',
              fontSize: displayTitle.length > 58 ? 58 : 66,
              fontWeight: 800,
              justifyContent: 'center',
              lineHeight: 1.08,
              maxWidth: 860,
              textAlign: 'center',
            }}
          >
            {displayTitle}
          </div>
        </div>
      </div>
    </div>
  )
}

export function createFallbackOgImage(title: string): ImageResponse {
  return new ImageResponse(<FallbackOgFrame title={title} />, FALLBACK_OG_SIZE)
}
