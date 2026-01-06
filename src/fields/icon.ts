import type { TextField } from 'payload'

type IconFieldOverrides = Partial<
	Omit<TextField, 'type' | 'hasMany' | 'minRows' | 'maxRows' | 'validate'>
>

export const iconField = (overrides?: IconFieldOverrides): TextField => {
	const { admin, ...rest } = overrides || {}

	return {
		name: 'icon',
		...rest,
		type: 'text',
		admin: {
			...admin,
			components: {
				...admin?.components,
				Field: '@/components/fields/icon-selector#IconSelector',
			},
		},
	} as TextField
}
