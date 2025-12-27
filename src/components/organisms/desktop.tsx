'use client'
import type { Window as WindowType } from '@/payload-types'
import Shortcut from '../molecules/shortcut'
import Wallpaper from '../molecules/wallpaper'
import Window from './window'
import { useWindows } from '@/contexts/WindowsContext'
import {
	DndContext,
	closestCenter,
	DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState } from 'react'

export interface ShortcutData extends Pick<WindowType, 'id' | 'title' | 'slug'> {}

interface DesktopProps {
	shortcuts: ShortcutData[]
}

export default function Desktop({ shortcuts }: DesktopProps) {
	const [items, setItems] = useState(shortcuts)
	const { openWindows } = useWindows()

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	return (
		<DndContext
			sensors={sensors}
			onDragEnd={handleDragEnd}
			collisionDetection={closestCenter}
		>
			<SortableContext
				items={items}
				strategy={verticalListSortingStrategy}
			>
				<div
					border='foreground/10'
					className='relative size-screen flex flex-col flex-wrap-reverse content-start p-1cell'
				>
					{items.map(({ id, slug, title }) => (
						<Shortcut
							key={id}
							id={id}
							slug={slug}
						>
							{title}
						</Shortcut>
					))}
					<Wallpaper />
					{openWindows.map((slug) => {
						const windowData = items.find((item) => item.slug === slug)
						if (!windowData) return null
						return (
							<Window
								key={slug}
								slug={slug}
								title={windowData.title}
							/>
						)
					})}
				</div>
			</SortableContext>
		</DndContext>
	)

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event

		if (active.id !== over?.id) {
			setItems((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id)
				const newIndex = items.findIndex((item) => item.id === over?.id)

				return arrayMove(items, oldIndex, newIndex)
			})
		}
	}
}
