// Articles = portfolio case studies (type: 'case-study') and service descriptions (type: 'service').
// Replaces the Works collection. The type field drives /works and /services listing routes.
import type { CollectionConfig } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'
import { contentBlocksField } from '@/fields/contentBlocks'
import { windowBehaviorFields } from '@/fields/windowBehavior'
import { createSlugField } from '@/fields/slugField'
import { createShortcutFields } from '@/fields/shortcutFields'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: { useAsTitle: 'title' },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (req.context.skipHooks) return
        req.context.skipHooks = true
        try {
          revalidateTag('window-content', {})
          revalidatePath(`/${doc.slug}`)
          revalidatePath('/')
          revalidatePath('/works')
          revalidatePath('/services')
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
          revalidatePath('/works')
          revalidatePath('/services')
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
