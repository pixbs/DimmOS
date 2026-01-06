'use client'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useWindows } from '@/contexts/WindowsContext'
import type { Window } from '@/payload-types'
import RemixIcon from '@/components/atoms/remix-icon'

type Props = {
	children: string
	id: UniqueIdentifier
	slug: string
	icon?: Window['icon']
	color?: Window['color']
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

	const { children = 'Hey', slug, icon, color = 'blue' } = props

	const colorClasses = {
		blue: 'bg-blue/10 text-blue selected:border-blue',
		green: 'bg-green/10 text-green selected:border-green',
		red: 'bg-red/10 text-red selected:border-red',
		yellow: 'bg-yellow/10 text-yellow selected:border-yellow',
	}

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
				className={`flex items-center justify-center text-2xl text-center transition-colors duration-200 ease-in-out size-1cell rounded-2xl backdrop-blur-xl ${colorClasses[color]}`}
			>
				<RemixIcon
					icon={icon || 'ri-folder-fill'}
					size={32}
				/>
			</div>
			<div bg='background'>{children}</div>
		</div>
	)
}
