import { Window } from '@/payload-types'

type ContentBlock = NonNullable<Window['content']>[number]
type Props = Extract<ContentBlock, { blockType: 'title' }>

export default function Title(props: Props) {
	return (
		<div className='title-block'>
			<h2>{props.title}</h2>
			{props.description && <p>{props.description}</p>}
		</div>
	)
}
