'use client'

import { useEffect, useRef } from 'react'

export default function Wallpaper() {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const parent = canvas.parentElement
		if (!parent) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const drawGrid = () => {
			const parentStyles = getComputedStyle(parent)
			const backgroundColor = parentStyles.backgroundColor
			const borderColor = parentStyles.borderColor

			const rect = parent.getBoundingClientRect()
			const width = rect.width
			const height = rect.height

			// Set canvas size to match parent
			canvas.width = width
			canvas.height = height

			// Calculate cell size (3.33% of canvas width)
			const cellSize = width * 0.0333

			// Fill background
			ctx.fillStyle = backgroundColor
			ctx.fillRect(0, 0, width, height)

			// Draw grid lines
			ctx.strokeStyle = borderColor
			ctx.lineWidth = 1

			// Calculate number of cells
			const cols = Math.ceil(width / cellSize)
			const rows = Math.ceil(height / cellSize)

			// Draw cells with right and bottom borders
			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const x = col * cellSize
					const y = row * cellSize

					// Draw right border
					ctx.beginPath()
					ctx.moveTo(x + cellSize - 0.5, y)
					ctx.lineTo(x + cellSize - 0.5, y + cellSize)
					ctx.stroke()

					// Draw bottom border
					ctx.beginPath()
					ctx.moveTo(x, y + cellSize - 0.5)
					ctx.lineTo(x + cellSize, y + cellSize - 0.5)
					ctx.stroke()
				}
			}
		}

		// Initial draw
		drawGrid()

		// Observe parent size changes
		const resizeObserver = new ResizeObserver(() => {
			drawGrid()
		})

		resizeObserver.observe(parent)

		return () => {
			resizeObserver.disconnect()
		}
	}, [])

	return (
		<canvas
			className='pointer-events-none absolute inset-0 z-[-1] h-full w-full'
			ref={canvasRef}
		/>
	)
}
