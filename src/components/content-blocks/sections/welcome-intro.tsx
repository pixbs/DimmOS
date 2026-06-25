'use client'

import { AnimatedText } from '@/components/animation'
import type { WelcomeIntroViewBlock } from './welcome-title'

export function WelcomeIntroView({ block }: { block: WelcomeIntroViewBlock }) {
  return (
    <section data-block-type="welcomeIntro" className="flex flex-col items-center text-center">
      <AnimatedText
        as="h2"
        split="words"
        className="text-2xl font-bold leading-tight text-fg"
      >
        {block.title}
      </AnimatedText>
      {block.role && <p className="mt-1 text-sm leading-snug text-fg">{block.role}</p>}
      {block.descriptor && (
        <p className="mt-4 w-full max-w-80 rounded-lg bg-bgs px-4 py-2.5 text-left text-[15px] leading-5 text-fg">
          {block.descriptor}
        </p>
      )}
    </section>
  )
}
