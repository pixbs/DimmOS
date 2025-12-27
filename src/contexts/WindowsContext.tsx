'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

type WindowsContextType = {
	openWindows: string[]
	addWindow: (slug: string) => void
	removeWindow: (slug: string) => void
}

const WindowsContext = createContext<WindowsContextType | null>(null)

export function WindowsProvider({ children }: { children: ReactNode }) {
	const [openWindows, setOpenWindows] = useState<string[]>([])
	const router = useRouter()

	const addWindow = (slug: string) => {
		if (!openWindows.includes(slug)) {
			setOpenWindows([...openWindows, slug])
		}
		window.history.pushState(null, '', `/${slug}`)
	}

	const removeWindow = (slug: string) => {
		setOpenWindows(openWindows.filter((s) => s !== slug))
		window.history.pushState(null, '', '/')
	}

	return (
		<WindowsContext.Provider value={{ openWindows, addWindow, removeWindow }}>
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
