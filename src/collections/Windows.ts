import type { CollectionConfig } from 'payload'
import { Title } from '@/blocks/Title'

export const Windows: CollectionConfig = {
	slug: 'windows',
	admin: {
		useAsTitle: 'title',
		defaultColumns: ['title'],
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
		},
		{
			name: 'shortcut',
			type: 'checkbox',
			label: 'Has Shortcut',
		},
		{
			name: 'conent',
			type: 'blocks',
			blocks: [Title],
		},
	],
}
