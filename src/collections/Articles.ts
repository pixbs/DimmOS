// Articles = portfolio case studies (type: 'case-study') and service descriptions (type: 'service').
// Replaces the Works collection. The type field drives articleList block filtering.
import type { CollectionConfig } from 'payload'
import { contentBlocksField } from '@/fields/contentBlocks'
import { windowButtonsField } from '@/fields/windowButtons'
import { windowBehaviorFields } from '@/fields/windowBehavior'
import { createSlugField } from '@/fields/slugField'
import { createShortcutFields } from '@/fields/shortcutFields'
import { createRevalidationHooks } from '@/hooks/revalidateContent'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: { useAsTitle: 'title' },
  access: {
    read: () => true, // public content — rendered on the frontend without auth
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  hooks: createRevalidationHooks(),
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true },
            {
              name: 'type',
              type: 'select',
              required: true,
              index: true,
              options: [
                { label: 'Case Study', value: 'case-study' },
                { label: 'Service', value: 'service' },
              ],
            },
            createSlugField('URL path identifier, e.g. "my-project" → /my-project'),
            contentBlocksField,
            windowButtonsField,
          ],
        },
        {
          label: 'Shortcut',
          fields: createShortcutFields('ri-folder-fill'),
        },
        {
          label: 'Window',
          fields: windowBehaviorFields,
        },
        // SEO tab appended here by @payloadcms/plugin-seo (tabbedUI: true)
      ],
    },
  ],
}
