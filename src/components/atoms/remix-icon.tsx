'use client'
import * as RemixIcons from '@remixicon/react'
import type { ComponentType, SVGProps } from 'react'

type RemixIconProps = SVGProps<SVGSVGElement> & {
	icon?: string | null
	size?: number | string
}

/**
 * Converts a Remix Icon class name (e.g., "ri-home-line") to a React component name (e.g., "RiHomeLine")
 */
function classToComponentName(className: string): string {
	// Remove "ri-" prefix and convert to PascalCase
	// e.g., "ri-home-line" -> "RiHomeLine"
	return className
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('')
}

export default function RemixIcon({ icon, size = 24, ...props }: RemixIconProps) {
	if (!icon) return null

	const componentName = classToComponentName(icon)
	const IconComponent = (RemixIcons as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)[
		componentName
	]

	if (!IconComponent) {
		console.warn(`Icon "${icon}" (${componentName}) not found in @remixicon/react`)
		return null
	}

	return (
		<IconComponent
			width={size}
			height={size}
			{...props}
		/>
	)
}
