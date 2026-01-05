import type { DraggableSyntheticListeners, DraggableAttributes } from '@dnd-kit/core'

type Props = {
	title: string
	onClose: () => void
	onMinimize?: () => void
	onFullscreen?: () => void
	isFullscreen?: boolean
	dragAttributes?: DraggableAttributes
	dragListeners?: DraggableSyntheticListeners
}

export default function TitleBar({
	title,
	onClose,
	onMinimize,
	onFullscreen,
	isFullscreen,
	dragAttributes,
	dragListeners,
}: Props) {
	const buttonStyle = 'size-6 flex items-center justify-center'
	const dotStyle = 'size-3 hover:size-4 p-1.5 rounded-full transition-all duration-200 ease-out'

	return (
		<div
			className='flex flex-row h-10 w-full items-center gap-10 p-2 cursor-grab active:cursor-grabbing'
			bg='background'
			border-b='foreground/10 1'
			{...dragAttributes}
			{...dragListeners}
		>
			<div className='w-full flex flex-row'>
				<button
					onClick={onClose}
					className={buttonStyle}
				>
					<div className={dotStyle + ' bg-red'} />
				</button>
				<button
					onClick={onMinimize}
					className={buttonStyle}
				>
					<div className={dotStyle + ' bg-yellow'} />
				</button>
				<button
					onClick={onFullscreen}
					className={buttonStyle}
				>
					<div className={dotStyle + ' bg-green'} />
				</button>
			</div>
			<div className='shrink-0'>{title}</div>
			<div className='w-full' />
		</div>
	)
}
