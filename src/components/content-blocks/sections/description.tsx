'use client'

import type { DescriptionBlock } from '@/payload-types'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { AnimatedText } from '@/components/animation'

/**
 * Description section: a 1/3-width animated big title beside 2/3-width rich text.
 * Stacks on narrow windows via container queries.
 */
export function DescriptionView({ block }: { block: DescriptionBlock }) {
  return (
    <section data-block-type="description" className="@container">
      <div className="grid grid-cols-1 gap-6 @2xl:grid-cols-3 @2xl:gap-8">
        <AnimatedText
          as="h2"
          text={block.title}
          className="text-3xl font-bold text-fg @2xl:col-span-1 @2xl:text-4xl"
        />
        <div className="prose prose-invert max-w-none @2xl:col-span-2">
          {block.body && <RichText data={block.body} />}
        </div>
      </div>
    </section>
  )
}
