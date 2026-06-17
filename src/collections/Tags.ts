// Tags = reusable labels attached to Articles (shown in the Works table view).
// Editors pick existing tags or create new ones via the relationship field's
// built-in "Add new" drawer on the Article.
import type { CollectionConfig } from 'payload'
import { createSlugField } from '@/fields/slugField'
import { createRevalidationHooks } from '@/hooks/revalidateContent'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: { useAsTitle: 'title' },
  access: {
    read: () => true, // public — tag titles render on the frontend
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  hooks: createRevalidationHooks(),
  fields: [
    { name: 'title', type: 'text', required: true },
    createSlugField('URL-safe identifier for the tag, e.g. "branding"'),
  ],
}
