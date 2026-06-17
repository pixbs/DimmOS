'use client'

import type { TitleBlock } from '@/payload-types'
import { AnimatedText } from '@/components/animation'

/**
 * Title section: a large letter-by-letter animated title with a supporting
 * description.
 */
export function SectionTitleView({ block }: { block: TitleBlock }) {
  return (
    <section data-block-type="sectionTitle" className="flex flex-col gap-3">
      <AnimatedText
        as="h2"
        text={block.title}
        split="letters"
        className="text-4xl font-bold text-fg @2xl:text-5xl"
      />
      {block.description && (
        <p className="max-w-2xl leading-relaxed text-fg/60">{block.description}</p>
      )}
    </section>
  )
}
