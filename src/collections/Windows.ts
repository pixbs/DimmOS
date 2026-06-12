// Windows = general content pages (about, contact, welcome).
// Portfolio work and services live in the Articles collection.
import type { CollectionConfig } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'
import { contentBlocksField } from '@/fields/contentBlocks'
import { windowBehaviorFields } from '@/fields/windowBehavior'
import { createSlugField } from '@/fields/slugField'
import { createShortcutFields } from '@/fields/shortcutFields'

export const Windows: CollectionConfig = {
  slug: 'windows',
  admin: { useAsTitle: 'title' },
  access: {
    read: () => true, // public content — rendered on the frontend without auth
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (req.context.skipHooks) return
        req.context.skipHooks = true
        try {
          revalidateTag('window-content', {})
          revalidatePath(`/${doc.slug}`)
          revalidatePath('/')
        } catch {}
        req.context.skipHooks = false
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        try {
          revalidateTag('window-content', {})
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
            createSlugField('URL path identifier, e.g. "about" → /about'),
            contentBlocksField,
          ],
        },
        {
          label: 'Shortcut',
          fields: createShortcutFields('ri-window-fill'),
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
