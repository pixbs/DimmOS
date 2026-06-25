// Windows = general content pages (about, contact, welcome).
// Portfolio work and services live in the Articles collection.
import type { CollectionConfig } from 'payload'
import { createContentBlocksField } from '@/fields/contentBlocks'
import { windowButtonsField } from '@/fields/windowButtons'
import { windowBehaviorFields, windowStartupFields } from '@/fields/windowBehavior'
import { createSlugField } from '@/fields/slugField'
import { createShortcutFields } from '@/fields/shortcutFields'
import { withAiGeneration } from '@/fields/ai-generation'
import { createRevalidationHooks } from '@/hooks/revalidateContent'

export const Windows: CollectionConfig = {
  slug: 'windows',
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
            withAiGeneration({ name: 'title', type: 'text', required: true }),
            createSlugField('URL path identifier, e.g. "about" → /about'),
            createContentBlocksField(),
            windowButtonsField,
          ],
        },
        {
          label: 'Shortcut',
          fields: createShortcutFields('ri-window-fill'),
        },
        {
          label: 'Window',
          fields: [...windowBehaviorFields, ...windowStartupFields],
        },
        // SEO tab appended here by @payloadcms/plugin-seo (tabbedUI: true)
      ],
    },
  ],
}
