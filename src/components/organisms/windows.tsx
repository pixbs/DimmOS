'use client'
import Window from './window'
import { useWindows } from '@/contexts/WindowsContext'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'

export default function Windows() {
	const { openWindows } = useWindows()

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	)

	return (
		<DndContext
			sensors={sensors}
			modifiers={[restrictToWindowEdges]}
		>
			{openWindows.map((slug) => (
				<Window
					key={slug}
					slug={slug}
				/>
			))}
		</DndContext>
	)
}
