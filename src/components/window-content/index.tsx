import type { Window, WindowButton } from '@/payload-types'
import { ContentBlocks } from '@/components/content-blocks'
import { WindowScaffold } from '@/components/window/window-scaffold'
import { WindowButtons } from '@/components/window/window-buttons'

export function WindowContent({
  blocks,
  buttons,
}: {
  blocks: NonNullable<Window['content']>
  buttons?: WindowButton
}) {
  const items = buttons ?? []
  return (
    <WindowScaffold footer={items.length ? <WindowButtons buttons={items} /> : undefined}>
      <div className="flex flex-col gap-6 px-6 py-8">
        <ContentBlocks blocks={blocks} />
      </div>
    </WindowScaffold>
  )
}
