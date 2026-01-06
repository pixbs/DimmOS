import type { Block } from 'payload'

export const Welcome: Block = {
	slug: 'welcome',
	labels: {
		singular: 'Welcome',
		plural: 'Welcomes',
	},
	fields: [
		{
			name: 'Name',
			type: 'text',
			required: true,
		},
		{
			name: 'Role',
			type: 'text',
			required: true,
		},
		{
			name: 'Message',
			type: 'textarea',
			required: false,
		},
	],
}
