import { Title } from '@/components/organisms/content/title/scheme'
import { Welcome } from '@/components/organisms/content/welcome/scheme'
import { iconField } from '@/fields/icon'
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
			type: 'tabs',
			tabs: [
				{
					label: 'Shortcut',
					fields: [
						{
							name: 'shortcut',
							type: 'checkbox',
							label: 'Has Shortcut',
						},
						{
							name: 'color',
							type: 'select',
							options: [
								{ label: 'Blue', value: 'blue' },
								{ label: 'Green', value: 'green' },
								{ label: 'Red', value: 'red' },
								{ label: 'Yellow', value: 'yellow' },
							],
							defaultValue: 'blue',
							required: true,
						},
						iconField({ label: 'Icon' }),
					],
				},
				{
					label: 'Content',
					fields: [
						{
							name: 'content',
							type: 'blocks',
							minRows: 1,
							blocks: [Title, Welcome],
						},
					],
				},
			],
		},
	],
}
