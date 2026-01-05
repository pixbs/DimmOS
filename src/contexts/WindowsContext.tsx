'use client'
import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

type WindowState = {
	position: { x: number; y: number }
	size: { width: number; height: number }
	isFullscreen: boolean
	minimized: boolean
}

type WindowsContextType = {
	openWindows: string[]
	windowStates: Record<string, WindowState>
	addWindow: (slug: string) => void
	closeWindow: (slug: string) => void
	minimizeWindow: (slug: string) => void
	restoreWindow: (slug: string) => void
	bringToFront: (slug: string) => void
	getZIndex: (slug: string) => number
	updateWindowState: (slug: string, state: Partial<WindowState>) => void
	getWindowState: (slug: string) => WindowState
}

const defaultWindowState: WindowState = {
	position: { x: 0, y: 0 },
	size: { width: 384, height: 240 },
	isFullscreen: false,
	minimized: false,
}

const WindowsContext = createContext<WindowsContextType | null>(null)

export function WindowsProvider({ children }: { children: ReactNode }) {
	const [openWindows, setOpenWindows] = useState<string[]>([])
	const [windowStates, setWindowStates] = useState<Record<string, WindowState>>({})

	const getWindowState = useCallback(
		(slug: string): WindowState => {
			return windowStates[slug] ?? defaultWindowState
		},
		[windowStates],
	)

	const updateWindowState = useCallback((slug: string, state: Partial<WindowState>) => {
		setWindowStates((prev) => ({
			...prev,
			[slug]: { ...defaultWindowState, ...prev[slug], ...state },
		}))
	}, [])

	const addWindow = useCallback(
		(slug: string) => {
			if (!openWindows.includes(slug)) {
				setOpenWindows((prev) => [...prev, slug])
				// Reset to default state when opening fresh
				setWindowStates((prev) => ({
					...prev,
					[slug]: defaultWindowState,
				}))
			} else {
				// If minimized, restore it
				const state = windowStates[slug]
				if (state?.minimized) {
					updateWindowState(slug, { minimized: false })
				}
				// Bring to front
				setOpenWindows((prev) => {
					const filtered = prev.filter((s) => s !== slug)
					return [...filtered, slug]
				})
			}
			window.history.pushState(null, '', `/${slug}`)
		},
		[openWindows, windowStates, updateWindowState],
	)

	const closeWindow = useCallback((slug: string) => {
		// Remove from open windows and clear state
		setOpenWindows((prev) => prev.filter((s) => s !== slug))
		setWindowStates((prev) => {
			const next = { ...prev }
			delete next[slug]
			return next
		})
		window.history.pushState(null, '', '/')
	}, [])

	const minimizeWindow = useCallback(
		(slug: string) => {
			updateWindowState(slug, { minimized: true })
		},
		[updateWindowState],
	)

	const restoreWindow = useCallback(
		(slug: string) => {
			updateWindowState(slug, { minimized: false })
			// Bring to front
			setOpenWindows((prev) => {
				const filtered = prev.filter((s) => s !== slug)
				return [...filtered, slug]
			})
		},
		[updateWindowState],
	)

	const bringToFront = useCallback((slug: string) => {
		setOpenWindows((prev) => {
			const filtered = prev.filter((s) => s !== slug)
			return [...filtered, slug]
		})
	}, [])

	const getZIndex = useCallback(
		(slug: string) => {
			const index = openWindows.indexOf(slug)
			return index + 10 // Base z-index of 10
		},
		[openWindows],
	)

	return (
		<WindowsContext.Provider
			value={{
				openWindows,
				windowStates,
				addWindow,
				closeWindow,
				minimizeWindow,
				restoreWindow,
				bringToFront,
				getZIndex,
				updateWindowState,
				getWindowState,
			}}
		>
			{children}
		</WindowsContext.Provider>
	)
}

export function useWindows() {
	const context = useContext(WindowsContext)
	if (!context) {
		throw new Error('useWindows must be used within a WindowsProvider')
	}
	return context
}

export default WindowsContext
