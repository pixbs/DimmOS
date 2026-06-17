'use client'

import type { HeroBlock } from '@/payload-types'
import { AnimatedText, ParallaxImagePair } from '@/components/animation'
import { useDocumentMedia } from '../document-media-context'

/**
 * Hero section: an animated title + description beside a 2/3-width parallax
 * image built from the article's bg/fg pair (via {@link useDocumentMedia}).
 *
 * Container-query driven: stacks on narrow windows, becomes a 1/3 + 2/3 grid
 * once the content area is wide enough. The image is omitted when the article
 * has no background image set.
 */
export function HeroView({ block }: { block: HeroBlock }) {
  const { background, foreground } = useDocumentMedia()
  return (
    <section data-block-type="hero" className="@container">
      <div className="grid grid-cols-1 gap-6 @2xl:grid-cols-3 @2xl:items-center @2xl:gap-8">
        <div className="flex flex-col gap-3 @2xl:col-span-1">
          <AnimatedText
            as="h2"
            text={block.title}
            className="text-2xl font-bold text-fg @2xl:text-3xl"
          />
          {block.description && (
            <p className="leading-relaxed text-fg/60">{block.description}</p>
          )}
        </div>
        {background && (
          <div className="py-4 @2xl:col-span-2">
            <ParallaxImagePair
              background={background}
              foreground={foreground}
              className="rounded-2xl"
            />
          </div>
        )}
      </div>
    </section>
  )
}
