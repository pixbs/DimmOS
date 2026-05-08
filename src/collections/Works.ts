import type { CollectionConfig } from 'payload'

export const Works: CollectionConfig = {
  slug: 'works',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Shortcut',
          fields: [
            {
              name: 'slug',
              type: 'text',
              index: true,
              admin: { description: 'URL path for this shortcut link (e.g. my-work)' },
              validate: (value: string | string[] | null | undefined) => {
                if (!value || Array.isArray(value)) return true
                if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
                  return 'Slug must be lowercase letters, numbers, and hyphens only'
                return true
              },
            },
            { name: 'showShortcut', type: 'checkbox', defaultValue: false },
            { name: 'shortcutName', type: 'text' },
            { name: 'shortcutIcon', type: 'text', defaultValue: 'ri-folder-fill' },
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
