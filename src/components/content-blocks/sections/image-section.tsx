'use client'

import type { ImageSectionBlock, Media } from '@/payload-types'
import { AnimatedDivider, PixelatedImage } from '@/components/animation'

/**
 * Image section: a single full-width image rendered with the de-pixelation
 * reveal. Sizes to the image's natural aspect ratio (not cropped).
 */
export function ImageSectionView({ block }: { block: ImageSectionBlock }) {
  const media = block.image as Media | number | null
  if (!media || typeof media === 'number' || !media.url) return null
  return (
    <section data-block-type="imageSection" className="pb-6">
      <AnimatedDivider className="mb-10"/>
      <PixelatedImage
        src={media.url}
        alt={media.alt ?? ''}
        width={media.width ?? 1600}
        height={media.height ?? 900}
        className="w-full rounded-2xl"
        imageClassName="block h-auto w-full"
      />
    </section>
  )
}
