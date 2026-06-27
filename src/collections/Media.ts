import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'seoGeneratedMetaImage',
      type: 'group',
      admin: { hidden: true },
      fields: [
        {
          name: 'sourceCollection',
          type: 'select',
          options: [
            { label: 'Windows', value: 'windows' },
            { label: 'Articles', value: 'articles' },
          ],
          index: true,
        },
        {
          name: 'sourceDocumentId',
          type: 'text',
          index: true,
        },
        {
          name: 'contentSignature',
          type: 'text',
        },
        {
          name: 'generatedAt',
          type: 'date',
        },
      ],
    },
  ],
  upload: true,
}
