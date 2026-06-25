'use client'

import type { WelcomeIntroBlock } from '@/payload-types'
import { AnimatedDivider, AnimatedText } from '@/components/animation'

export function WelcomeIntroView({ block }: { block: WelcomeIntroBlock }) {
  return (
    <section data-block-type="welcomeIntro" className="flex flex-col items-center gap-3 pt-4 text-center">
      <AnimatedText
        as="h2"
        split="words"
        className="text-3xl font-bold text-fg @2xl:text-4xl"
      >
        {block.title}
      </AnimatedText>
      {block.role && <p className="text-base text-fg/80">{block.role}</p>}
      {block.descriptor && (
        <p className="max-w-xl rounded-lg bg-bgs/70 px-5 py-3 text-left text-sm leading-relaxed text-fg/85 @2xl:text-base">
          {block.descriptor}
        </p>
      )}
      <AnimatedDivider className="mt-4" />
    </section>
  )
}
