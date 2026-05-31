// Windows = general content pages (about, contact, welcome).
// Portfolio work and services live in the Articles collection.
import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { contentBlocksField } from '@/fields/contentBlocks'
import { windowBehaviorFields } from '@/fields/windowBehavior'

export const Windows: CollectionConfig = {
  slug: 'windows',
  admin: { useAsTitle: 'title' },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (req.context.skipHooks) return
        req.context.skipHooks = true
        try {
          revalidatePath(`/${doc.slug}`)
          revalidatePath('/')
        } catch {}
        req.context.skipHooks = false
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        try {
          revalidatePath(`/${doc.slug}`)
          revalidatePath('/')
        } catch {}
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: { description: 'URL path identifier, e.g. "about" → /about' },
              validate: (value: string | null | undefined) => {
                if (!value) return 'Slug is required'
                if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
                  return 'Slug must be lowercase letters, numbers, and hyphens only'
                return true
              },
            },
            contentBlocksField,
          ],
        },
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
        {
          label: 'Window',
          fields: windowBehaviorFields,
        },
        // SEO tab appended here by @payloadcms/plugin-seo (tabbedUI: true)
      ],
    },
  ],
}
