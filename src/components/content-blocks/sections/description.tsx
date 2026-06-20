'use client'

import type { DescriptionBlock } from '@/payload-types'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { AnimatedDivider, AnimatedText,  } from '@/components/animation'

/**
 * Description section: a 1/3-width animated big title beside 2/3-width rich text.
 * Stacks on narrow windows via container queries.
 */
export function DescriptionView({ block }: { block: DescriptionBlock }) {
  return (
    <section data-block-type="description" className="@container">
      <AnimatedDivider className="mb-10"/>
      <div className="grid grid-cols-1 gap-6 @2xl:grid-cols-3 @2xl:gap-8">
        <AnimatedText
          as="h2"
          className="text-lg font-bold text-fg @2xl:col-span-1 @2xl:text-xl @2xl:pl-6"
        >
          {block.title}
        </AnimatedText>
        <div className="prose prose-invert max-w-none @2xl:col-span-2 flex flex-row gap-6">
          <AnimatedDivider orientation="vertical" className="hidden @2xl:block"/>
          {block.body && <RichText data={block.body} />}
        </div>
      </div>
    </section>
  )
}
