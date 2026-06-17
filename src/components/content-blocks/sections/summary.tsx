'use client'

import type { SummaryBlock } from '@/payload-types'
import { AnimatedText, AnimatedDivider } from '@/components/animation'

/**
 * Summary section: a narrow (1/3) title+body column beside a wide (2/3) one,
 * separated by a draw-on-scroll divider.
 *
 * Container-query driven: stacks with a horizontal divider on narrow windows,
 * sits side-by-side with a vertical divider once wide enough.
 */
export function SummaryView({ block }: { block: SummaryBlock }) {
  return (
    <section data-block-type="summary" className="@container">
      <div className="flex flex-col gap-6 @2xl:flex-row @2xl:gap-8">
        <div className="flex flex-col gap-3 @2xl:w-1/3">
          {block.leftTitle && (
            <AnimatedText as="h3" text={block.leftTitle} className="text-lg font-semibold text-fg" />
          )}
          {block.leftBody && <p className="leading-relaxed text-fg/60">{block.leftBody}</p>}
        </div>
        <AnimatedDivider orientation="horizontal" className="@2xl:hidden" />
        <AnimatedDivider orientation="vertical" className="hidden @2xl:block" />
        <div className="flex flex-col gap-3 @2xl:flex-1">
          {block.rightTitle && (
            <AnimatedText as="h3" text={block.rightTitle} className="text-lg font-semibold text-fg" />
          )}
          {block.rightBody && <p className="leading-relaxed text-fg/60">{block.rightBody}</p>}
        </div>
      </div>
    </section>
  )
}
