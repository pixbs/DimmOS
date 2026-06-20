import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { PixelatedImage } from '@/components/animation/pixelated-image'

describe('PixelatedImage', () => {
  it('always renders the underlying image (for SSR/SEO and no-canvas environments)', () => {
    const { getByAltText } = render(
      <PixelatedImage src="/api/media/file/hero.jpg" alt="Hero banner" width={1600} height={900} />,
    )
    const img = getByAltText('Hero banner') as HTMLImageElement
    expect(img.getAttribute('src')).toContain('/api/media/file/hero.jpg')
  })

  it('removes the canvas overlay when no 2D context is available (jsdom)', async () => {
    const { container } = render(
      <PixelatedImage src="/api/media/file/hero.jpg" alt="Hero banner" width={1600} height={900} />,
    )
    await waitFor(() => {
      expect(container.querySelector('canvas')).toBeNull()
    })
  })
})
