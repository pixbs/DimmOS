import type { CollectionConfig } from 'payload'

export const Windows: CollectionConfig = {
  slug: 'windows',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL path identifier, e.g. "about" → /about' },
      validate: (value: string) => {
        if (!value) return 'Slug is required'
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
          return 'Slug must be lowercase letters, numbers, and hyphens only'
        return true
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Shortcut',
          fields: [
            { name: 'showShortcut', type: 'checkbox', defaultValue: false },
            { name: 'shortcutName', type: 'text' },
            { name: 'shortcutIcon', type: 'text', defaultValue: 'ri-window-fill' },
            {
              name: 'shortcutOrder',
              type: 'number',
              admin: {
                description:
                  'Controls position across all shortcuts. Lower = earlier. Leave blank to append.',
              },
            },
          ],
        },
      ],
    },
  ],
}
