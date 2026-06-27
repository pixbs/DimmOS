import { describe, expect, it } from 'vitest'

import { generateMeta } from '@/utilities/generateMeta'

function getOpenGraphImages(meta: ReturnType<typeof generateMeta>) {
  return (meta.openGraph as any)?.images as { url: string }[]
}

describe('generateMeta', () => {
  it('uses the fallback OG image route when no SEO image exists', () => {
    const meta = generateMeta({
      title: 'Fallback Window',
      slug: 'fallback-window',
      meta: { title: 'Fallback Window Meta' },
    })

    expect(getOpenGraphImages(meta)).toEqual([{ url: '/og/fallback-window' }])
  })

  it('preserves a manual or generated SEO image ahead of the fallback route', () => {
    const meta = generateMeta({
      title: 'Manual Window',
      slug: 'manual-window',
      meta: {
        image: { url: '/api/media/file/manual.png' },
      },
    })

    expect(getOpenGraphImages(meta)).toEqual([{ url: '/api/media/file/manual.png' }])
  })

  it('uses the site fallback OG image route for generic metadata', () => {
    const meta = generateMeta(null)

    expect(getOpenGraphImages(meta)).toEqual([{ url: '/og' }])
  })
})
