import type { Field } from 'payload'

export function validateSlug(value: string | null | undefined): true | string {
  if (!value) return 'Slug is required'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
    return 'Slug must be lowercase letters, numbers, and hyphens only'
  return true
}

// description varies per collection so admin UI examples stay collection-specific
export function createSlugField(description: string): Field {
  return {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: { description },
    validate: validateSlug,
  }
}
