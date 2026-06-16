import type { Window } from '@/payload-types'
import { ContentBlocks } from '@/components/content-blocks'

export function WindowContent({ blocks }: { blocks: NonNullable<Window['content']> }) {
  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      <ContentBlocks blocks={blocks} />
    </div>
  )
}
