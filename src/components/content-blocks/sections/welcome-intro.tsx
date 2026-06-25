'use client'

import { AnimatedText } from '@/components/animation'
import type { WelcomeIntroViewBlock } from './welcome-title'

export function WelcomeIntroView({ block }: { block: WelcomeIntroViewBlock }) {
  return (
    <section data-block-type="welcomeIntro" className="@container flex w-full flex-col items-center text-center">
      <AnimatedText
        as="h1"
        split="words"
        className="mx-auto max-w-[min(100%,16ch)] text-center text-[clamp(1.5rem,7cqw,3rem)] font-semibold leading-tight text-fg"
        innerClassName="w-full justify-center"
      >
        {block.title}
      </AnimatedText>
      {block.role && (
        <p className="mt-1 text-[clamp(0.875rem,2.2cqw,1.125rem)] leading-snug text-fg">
          {block.role}
        </p>
      )}
      {block.descriptor && (
        <p className="mt-4 w-full max-w-[min(100%,32rem)] rounded-lg bg-bgs px-4 py-2.5 text-left text-[clamp(0.9375rem,2.4cqw,1.0625rem)] leading-[1.35] text-fg">
          {block.descriptor}
        </p>
      )}
    </section>
  )
}
