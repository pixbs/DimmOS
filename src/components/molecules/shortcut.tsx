'use client'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useWindows } from '@/contexts/WindowsContext'

type Props = {
	children: string
	id: UniqueIdentifier
	slug: string
}

const colors = [
	'bg-red hover:bg-red/80',
	'bg-green hover:bg-green/80',
	'bg-blue hover:bg-blue/80',
	'bg-yellow hover:bg-yellow/80',
] as const

export default function Shortcut(props: Props) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: props.id,
	})
	const { addWindow } = useWindows()

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	const { children = 'Hey', slug } = props
	const color = colors[Math.floor(Math.random() * colors.length)]

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
				className={`border-foreground/20 rounded-sm text-center transition-colors duration-200 ease-in-out size-1cell ${color}`}
			/>
			<div bg='background'>{children}</div>
		</div>
	)
}
