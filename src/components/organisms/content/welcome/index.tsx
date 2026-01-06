import { Window } from '@/payload-types'

type ContentBlock = NonNullable<Window['content']>[number]
type Props = Extract<ContentBlock, { blockType: 'welcome' }>

export default function Welcome(props: Props) {
	return (
		<div>
			<h2>{props.Name}</h2>
			<h3>{props.Role}</h3>
			{props.Message && <p>{props.Message}</p>}
		</div>
	)
}
