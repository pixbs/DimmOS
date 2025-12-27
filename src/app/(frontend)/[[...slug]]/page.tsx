'use client'
import { useWindows } from '@/contexts/WindowsContext'
import { useEffect, use } from 'react'

export default function Page({ params }: { params: Promise<{ slug: string[] }> }) {
	const { addWindow } = useWindows()
	const { slug } = use(params)

	useEffect(() => {
		if (slug && slug.length > 0) {
			addWindow(slug[0])
		}
	}, [slug])

	return <></>
}
