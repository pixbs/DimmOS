import { Window } from '@/payload-types'
import Title from '@/components/organisms/content/title'
import Welcome from '../organisms/content/welcome'

type ContentBlock = NonNullable<Window['content']>[number]

type Props = {
	content: Window['content']
}

export default function WindowContent({ content }: Props) {
	if (!content || content.length === 0) return null

	return (
		<div className='flex flex-col flex-1 overflow-auto p-4'>
			{content.map((block) => {
				switch (block.blockType) {
					case 'title':
						return (
							<Title
								key={block.id}
								{...(block as Extract<ContentBlock, { blockType: 'title' }>)}
							/>
						)
					case 'welcome':
						return (
							<Welcome
								key={block.id}
								{...(block as Extract<ContentBlock, { blockType: 'welcome' }>)}
							/>
						)
					default:
						return null
				}
			})}
		</div>
	)
}
