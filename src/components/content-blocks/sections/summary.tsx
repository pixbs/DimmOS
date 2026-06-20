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
    <section data-block-type="summary" className="@container pb-10">
      <AnimatedDivider className="mb-10"/>
      <div className="grid grid-cols-1 gap-6 @2xl:grid-cols-3 @2xl:items-start @2xl:gap-8 @2xl:top">
        <div className="flex flex-col gap-3 @2xl:col-span-1 @2xl:pl-4">
          {block.leftTitle && (
            <AnimatedText as="h3" className="text-xs uppercase text-fg/80">
              {block.leftTitle}
            </AnimatedText>
          )}
          {block.leftBody && <p className="text-fg">{block.leftBody}</p>}
        </div>
        <div className="flex flex-col @2xl:flex-row gap-10 @2xl:col-span-2 @2xl:h-full">
          <AnimatedDivider orientation="vertical" className="hidden @2xl:block"/>
          <AnimatedDivider className="block @2xl:hidden"/>
          <div className="flex flex-col gap-3">
            {block.rightTitle && (
              <AnimatedText as="h3" className="text-xs uppercase text-fg/80">
                {block.rightTitle}
              </AnimatedText>
            )}
            {block.rightBody && <p className="text-fg">{block.rightBody}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
