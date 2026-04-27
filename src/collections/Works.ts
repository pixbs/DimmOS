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
