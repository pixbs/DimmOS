'use client'
import { useWindows } from '@/contexts/WindowsContext'
import { useEffect, useState, useCallback } from 'react'
import { useDraggable, useDndMonitor } from '@dnd-kit/core'
import TitleBar from '../molecules/title-bar'

type Props = {
	slug: string
}

type ResizeDirection = 'right' | 'bottom' | 'corner' | null

export default function Window({ slug }: Props) {
	const { closeWindow, minimizeWindow, bringToFront, getZIndex, getWindowState, updateWindowState } =
		useWindows()
	const [title, setTitle] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [resizing, setResizing] = useState<ResizeDirection>(null)
	const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
	const [animating, setAnimating] = useState(false)

	const windowState = getWindowState(slug)
	const { position, size, isFullscreen, minimized } = windowState

	const windowId = `window-${slug}`
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: windowId,
	})

	const handleFullscreenToggle = useCallback(() => {
		setAnimating(true)
		if (isFullscreen) {
			// Restore to default centered position and size
			updateWindowState(slug, {
				position: { x: 0, y: 0 },
				size: { width: 384, height: 240 },
				isFullscreen: false,
			})
		} else {
			// Calculate fullscreen position and size (1 tile = 64px margin)
			const margin = 64
			const fullWidth = window.innerWidth - margin * 2
			const fullHeight = window.innerHeight - margin * 2
			// Calculate position relative to center (since default is centered)
			const centerX = window.innerWidth / 2 - 192 // 12rem = 192px
			const centerY = window.innerHeight / 2 - 120 // 7.5rem = 120px
			updateWindowState(slug, {
				position: { x: margin - centerX, y: margin - centerY },
				size: { width: fullWidth, height: fullHeight },
				isFullscreen: true,
			})
		}
		setTimeout(() => setAnimating(false), 300)
	}, [isFullscreen, slug, updateWindowState])

	// Persist position after drag ends
	useDndMonitor({
		onDragEnd(event) {
			if (event.active.id === windowId && event.delta) {
				updateWindowState(slug, {
					position: {
						x: position.x + event.delta.x,
						y: position.y + event.delta.y,
					},
				})
			}
		},
	})

	// Resize handlers
	const handleResizeStart = useCallback(
		(direction: ResizeDirection) => (e: React.PointerEvent) => {
			e.preventDefault()
			e.stopPropagation()
			setResizing(direction)
			setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height })
			updateWindowState(slug, { isFullscreen: false })
			;(e.target as HTMLElement).setPointerCapture(e.pointerId)
		},
		[size, slug, updateWindowState],
	)

	const handleResizeMove = useCallback(
		(e: React.PointerEvent) => {
			if (!resizing) return

			const deltaX = e.clientX - resizeStart.x
			const deltaY = e.clientY - resizeStart.y

			const minWidth = 240 // min-w-60
			const minHeight = 160 // min-h-40

			// Calculate current window position in viewport
			const centerX = window.innerWidth / 2 - 192 // 12rem = 192px
			const centerY = window.innerHeight / 2 - 120 // 7.5rem = 120px
			const windowLeft = centerX + position.x
			const windowTop = centerY + position.y

			// Calculate max size to stay within viewport
			const maxWidth = window.innerWidth - windowLeft
			const maxHeight = window.innerHeight - windowTop

			let newWidth = size.width
			let newHeight = size.height

			if (resizing === 'right' || resizing === 'corner') {
				newWidth = Math.min(maxWidth, Math.max(minWidth, resizeStart.width + deltaX))
			}
			if (resizing === 'bottom' || resizing === 'corner') {
				newHeight = Math.min(maxHeight, Math.max(minHeight, resizeStart.height + deltaY))
			}

			updateWindowState(slug, { size: { width: newWidth, height: newHeight } })
		},
		[resizing, resizeStart, size, slug, updateWindowState, position],
	)

	const handleResizeEnd = useCallback((e: React.PointerEvent) => {
		setResizing(null)
		;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
	}, [])

	useEffect(() => {
		const fetchWindow = async () => {
			try {
				const res = await fetch(`/api/windows?where[slug][equals]=${slug}&limit=1`)
				const data = await res.json()
				if (data.docs?.[0]) {
					setTitle(data.docs[0].title)
				}
			} finally {
				setLoading(false)
			}
		}
		fetchWindow()
	}, [slug])

	// Don't render if minimized
	if (minimized) return null

	// Calculate final position including current drag transform
	const x = position.x + (transform?.x ?? 0)
	const y = position.y + (transform?.y ?? 0)

	const windowStyle = {
		left: `calc(50% - 12rem + ${x}px)`,
		top: `calc(50% - 7.5rem + ${y}px)`,
		width: `${size.width}px`,
		height: `${size.height}px`,
		zIndex: getZIndex(slug),
	}

	return (
		<div
			ref={setNodeRef}
			className={`absolute flex flex-col min-w-60 min-h-40 rounded-xl select-none ${animating ? 'transition-all duration-300 ease-out' : ''}`}
			bg='background'
			border='foreground/10 1'
			overflow='hidden'
			onPointerDown={() => bringToFront(slug)}
			style={{
				...windowStyle,
				cursor: isDragging ? 'grabbing' : undefined,
			}}
		>
			<TitleBar
				title={`~/${slug}`}
				onClose={() => closeWindow(slug)}
				onMinimize={() => minimizeWindow(slug)}
				onFullscreen={handleFullscreenToggle}
				isFullscreen={isFullscreen}
				dragAttributes={attributes}
				dragListeners={listeners}
			/>
			{loading ? (
				<div className='flex items-center justify-center h-full w-full'>Loading</div>
			) : (
				<div className='flex items-center justify-center h-full w-full'>
					{title || 'Untitled Window'}
				</div>
			)}
			{/* Resize handles */}
			<div
				className='absolute top-0 right-0 w-1.5 h-[calc(100%-16px)] cursor-ew-resize border-r-2 border-transparent transition-colors'
				hover='border-foreground/30'
				onPointerDown={handleResizeStart('right')}
				onPointerMove={handleResizeMove}
				onPointerUp={handleResizeEnd}
			/>
			<div
				className='absolute bottom-0 left-0 w-[calc(100%-16px)] h-1.5 cursor-ns-resize border-b-2 border-transparent transition-colors'
				hover='border-foreground/30'
				onPointerDown={handleResizeStart('bottom')}
				onPointerMove={handleResizeMove}
				onPointerUp={handleResizeEnd}
			/>
			<div
				className='absolute right-0 bottom-0 w-4 h-4 cursor-se-resize rounded-br-xl border-r-2 border-b-2 border-transparent transition-colors'
				hover='border-foreground/30'
				onPointerDown={handleResizeStart('corner')}
				onPointerMove={handleResizeMove}
				onPointerUp={handleResizeEnd}
			/>
		</div>
	)
}
