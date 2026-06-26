'use client'

import type { TitleBlock } from '@/payload-types'
import { AnimatedDivider, AnimatedText } from '@/components/animation'

/**
 * Title section: a large letter-by-letter animated title with a supporting
 * description.
 */
export function SectionTitleView({ block }: { block: TitleBlock }) {
  return (
    <section data-block-type="sectionTitle" className="flex flex-col gap-3 pt-10">
      <AnimatedText
        as="h2"
        split="letters"
        className="text-4xl font-bold text-fg @2xl:text-5xl"
      >
        {block.title}
      </AnimatedText>
      {block.role && <p className="text-sm font-medium text-fg/75">{block.role}</p>}
      {block.description && (
        <p className="max-w-2xl leading-relaxed text-fg/60">{block.description}</p>
      )}
    <AnimatedDivider className="mt-6"/>
    </section>
  )
}
