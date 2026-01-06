import { Title } from '@/components/organisms/content/title/scheme'
import { Welcome } from '@/components/organisms/content/welcome/scheme'
import type { CollectionConfig } from 'payload'

export const Windows: CollectionConfig = {
	slug: 'windows',
	access: {
		read: () => true, // Public read access
	},
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
			name: 'slug',
			type: 'text',
			required: true,
			unique: true,
			hooks: {
				beforeValidate: [
					({ value }) => {
						if (typeof value === 'string') {
							return value
								.toString()
								.toLowerCase()
								.replace(/\s+/g, '-') // Replace spaces with -
								.replace(/[^\w\-]+/g, '') // Remove all non-word chars
								.replace(/\-\-+/g, '-') // Replace multiple - with single -
								.replace(/^-+/, '') // Trim - from start of text
								.replace(/-+$/, '') // Trim - from end of text
						}
						return value
					},
				],
			},
		},
		{
			name: 'shortcut',
			type: 'checkbox',
			label: 'Has Shortcut',
		},
		{
			name: 'content',
			type: 'blocks',
			blocks: [Title, Welcome],
		},
	],
}
