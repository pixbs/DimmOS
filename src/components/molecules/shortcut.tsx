'use client'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useWindows } from '@/contexts/WindowsContext'
import { rsLatin } from 'payload/i18n/rsLatin'
import { tr } from 'payload/i18n/tr'

type Props = {
	children: string
	id: UniqueIdentifier
	slug: string
}

export default function Shortcut(props: Props) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: props.id,
	})
	const { addWindow } = useWindows()

	console.log(CSS.Transform.toString(transform))

	const style = {
		transform: CSS.Transform.toString(transform) || 'translate3d(0px, 0px, 0) scaleX(1) scaleY(1)',
		transition,
		zIndex: isDragging ? 64 : 'auto',
	}

	const { children = 'Hey', slug } = props

	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			onDoubleClick={() => {
				addWindow(slug)
			}}
			className='flex flex-col items-center gap-1 w-2cell h-2cell cursor-pointer'
			style={style}
		>
			<div
				className={`border-foreground/20 text-center transition-colors duration-200 ease-in-out size-1cell bg-yellow/10 rounded-2xl backdrop-blur-2xl border border-yellow/10 selected:border-yellow`}
			/>
			<div bg='background'>{children}</div>
		</div>
	)
}
