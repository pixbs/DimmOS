'use client'

import { useField, XIcon } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { useState, useMemo, useCallback, useEffect } from 'react'
import './styles.scss'

const CSS_URL = 'https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css'
const TAGS_URL = 'https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/tags.json'

type TagsJson = Record<string, Record<string, string>>

interface IconData {
	className: string
	searchTerms: string // icon name + tags combined for searching
}

export const IconSelector: TextFieldClientComponent = ({ path, field }) => {
	const { value, setValue } = useField<string>({ path })
	const [search, setSearch] = useState('')
	const [icons, setIcons] = useState<IconData[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchIcons = async () => {
			try {
				// Fetch both CSS (for valid class names) and tags.json (for search terms)
				const [cssResponse, tagsResponse] = await Promise.all([fetch(CSS_URL), fetch(TAGS_URL)])

				if (!cssResponse.ok) throw new Error('Failed to fetch CSS')
				if (!tagsResponse.ok) throw new Error('Failed to fetch tags')

				const cssText = await cssResponse.text()
				const tagsData: TagsJson = await tagsResponse.json()

				// Extract valid icon class names from CSS using regex
				// Matches patterns like .ri-home-line:before, .ri-home-fill:before
				const classRegex = /\.(ri-[a-z0-9-]+):before/g
				const validClasses = new Set<string>()
				let match
				while ((match = classRegex.exec(cssText)) !== null) {
					validClasses.add(match[1])
				}

				// Build a map of base icon name to tags for search
				const tagsMap = new Map<string, string>()
				for (const category of Object.values(tagsData)) {
					if (typeof category === 'object' && category !== null) {
						for (const [iconName, tags] of Object.entries(category)) {
							if (iconName.startsWith('_')) continue
							tagsMap.set(iconName, tags)
						}
					}
				}

				// Create icon data only for valid classes
				const iconData: IconData[] = []
				for (const className of validClasses) {
					// Extract base name from class (e.g., "ri-home-line" -> "home")
					const baseName = className.replace(/^ri-/, '').replace(/-(line|fill)$/, '')

					const tags = tagsMap.get(baseName) || ''
					const searchTerms = `${baseName} ${tags}`.toLowerCase()

					iconData.push({ className, searchTerms })
				}

				// Sort alphabetically
				iconData.sort((a, b) => a.className.localeCompare(b.className))

				setIcons(iconData)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load icons')
			} finally {
				setLoading(false)
			}
		}
		fetchIcons()
	}, [])

	const filteredIcons = useMemo(() => {
		if (!search.trim()) return icons
		const searchLower = search.toLowerCase().replace(/[- ]/g, '')
		return icons.filter((icon) => icon.searchTerms.replace(/[- ]/g, '').includes(searchLower))
	}, [search, icons])

	const handleSelect = useCallback(
		(icon: string) => {
			setValue(value === icon ? '' : icon)
		},
		[setValue, value],
	)

	const handleClear = useCallback(() => {
		setValue('')
	}, [setValue])

	const label = typeof field.label === 'string' ? field.label : 'Icon'

	return (
		<div className='icon-selector'>
			<label className='icon-selector__label'>{label}</label>

			{value && (
				<div className='icon-selector__current'>
					<i className={value} />
					<span className='icon-selector__current-name'>{value}</span>
					<button
						type='button'
						className='icon-selector__clear'
						onClick={handleClear}
					>
						<XIcon />
					</button>
				</div>
			)}

			<div className='icon-selector__search-wrapper'>
				<i className='ri-search-line icon-selector__search-icon' />
				<input
					type='text'
					className='icon-selector__search'
					placeholder='Search icons...'
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				{search && (
					<button
						type='button'
						className='icon-selector__search-clear'
						onClick={() => setSearch('')}
					>
						<XIcon />
					</button>
				)}
			</div>

			<div className='icon-selector__container'>
				{loading ? (
					<div className='icon-selector__loading'>Loading icons...</div>
				) : error ? (
					<div className='icon-selector__error'>{error}</div>
				) : (
					<div className='icon-selector__grid'>
						{filteredIcons.length > 0 ? (
							filteredIcons.map((icon) => (
								<button
									key={icon.className}
									type='button'
									className={`icon-selector__item ${value === icon.className ? 'icon-selector__item--selected' : ''}`}
									onClick={() => handleSelect(icon.className)}
									title={icon.className}
								>
									<i className={icon.className} />
								</button>
							))
						) : (
							<div className='icon-selector__empty'>No icons found</div>
						)}
					</div>
				)}
			</div>

			<div className='icon-selector__count'>
				{filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''}
			</div>
		</div>
	)
}
