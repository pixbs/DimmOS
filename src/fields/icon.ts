import type { Field } from 'payload'

export const iconField = (overrides?: Partial<Field> & { name?: string }): Field => ({
	name: overrides?.name || 'icon',
	type: 'text',
	admin: {
		components: {
			Field: '@/components/fields/icon-selector#IconSelector',
		},
	},
	...overrides,
})
