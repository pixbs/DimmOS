import type { WelcomeIntroBlock } from '@/payload-types'

export type WelcomeIntroViewBlock = Pick<WelcomeIntroBlock, 'title' | 'role' | 'descriptor' | 'blockType'>

type BlockTypeOnly = { blockType?: string }
type SectionTitleLike = {
  blockType: 'sectionTitle'
  title: string
  role?: string | null
  description?: string | null
}

export function shouldRenderTitleAsWelcomeIntro(block: BlockTypeOnly, previousBlock?: BlockTypeOnly) {
  return block.blockType === 'sectionTitle' && previousBlock?.blockType === 'interactivePortrait'
}

export function titleBlockToWelcomeIntro(block: SectionTitleLike): WelcomeIntroViewBlock {
  return {
    blockType: 'welcomeIntro',
    title: block.title,
    role: block.role,
    descriptor: block.description,
  }
}
