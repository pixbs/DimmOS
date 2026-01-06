import type { Block } from 'payload'

export const Title: Block = {
	slug: 'title',
	labels: {
		singular: 'Title',
		plural: 'Titles',
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
		},
		{
			name: 'description',
			type: 'textarea',
			required: false,
		},
	],
}
