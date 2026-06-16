import type { Field } from 'payload'

// Action buttons pinned to the bottom of a window. Each button either opens
// another window/page (internal slug) or links out (external URL). Shared by
// the Windows and Articles collections via a single generated interface.
export const windowButtonsField: Field = {
  name: 'buttons',
  type: 'array',
  interfaceName: 'WindowButton',
  labels: { singular: 'Button', plural: 'Buttons' },
  admin: {
    description: 'Action buttons pinned to the bottom of the window.',
  },
  fields: [
    { name: 'label', type: 'text', required: true },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
      ],
    },
    {
      name: 'target',
      type: 'radio',
      defaultValue: 'internal',
      options: [
        { label: 'Open window / page', value: 'internal' },
        { label: 'External URL', value: 'external' },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        condition: (_, sibling) => sibling?.target === 'internal',
        description: 'Slug of the window/page to open, e.g. "works".',
      },
    },
    {
      name: 'href',
      type: 'text',
      admin: { condition: (_, sibling) => sibling?.target === 'external' },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
      admin: { condition: (_, sibling) => sibling?.target === 'external' },
    },
  ],
}
