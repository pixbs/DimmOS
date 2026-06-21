import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  AI_GENERATE_FIELD_COMPONENT,
  findAiGenerationField,
  sanitizeAiContext,
  withAiGeneration,
} from '@/fields/ai-generation'

describe('withAiGeneration', () => {
  it('marks text fields and injects the Payload afterInput component', () => {
    const field = withAiGeneration({
      name: 'headline',
      type: 'text',
      admin: { placeholder: 'Short headline' },
    } as Field)
    const admin = field.admin as {
      components?: {
        afterInput?: unknown
      }
      placeholder?: string
    }

    expect(field.custom?.aiGeneration).toEqual({ enabled: true })
    expect(admin.placeholder).toBe('Short headline')
    expect(admin.components?.afterInput).toMatchObject({
      path: AI_GENERATE_FIELD_COMPONENT,
    })
  })

  it('rejects non-text fields', () => {
    expect(() => withAiGeneration({ name: 'enabled', type: 'checkbox' } as Field)).toThrow(
      /text or textarea/,
    )
  })
})

describe('findAiGenerationField', () => {
  const fields: Field[] = [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            withAiGeneration({ name: 'title', type: 'text', required: true }),
            { name: 'slug', type: 'text' },
            {
              name: 'content',
              type: 'blocks',
              blocks: [
                {
                  fields: [
                    withAiGeneration({ name: 'title', type: 'text', required: true }),
                    withAiGeneration({
                      name: 'description',
                      type: 'textarea',
                      admin: { placeholder: 'Describe the section' },
                    }),
                  ],
                  slug: 'hero',
                },
                {
                  fields: [
                    {
                      fields: [
                        { name: 'value', type: 'text' },
                        withAiGeneration({
                          name: 'label',
                          type: 'text',
                          admin: { description: 'Caption below the figure' },
                        }),
                      ],
                      name: 'stats',
                      type: 'array',
                    },
                  ],
                  slug: 'stats',
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  const data = {
    content: [
      { blockType: 'hero', description: '', title: '' },
      { blockType: 'stats', stats: [{ label: '', value: '42%' }] },
    ],
    slug: 'existing-page',
    title: 'Existing title',
  }

  it('finds top-level opt-in fields inside tabs', () => {
    const field = findAiGenerationField({ data, fields, path: 'title' })

    expect(field?.label).toBe('Title')
    expect(field?.path).toBe('title')
    expect(field?.type).toBe('text')
  })

  it('finds opt-in fields inside blocks and arrays', () => {
    expect(findAiGenerationField({ data, fields, path: 'content.0.description' })).toMatchObject({
      label: 'Description',
      path: 'content.0.description',
      placeholder: 'Describe the section',
      type: 'textarea',
    })

    expect(findAiGenerationField({ data, fields, path: 'content.1.stats.0.label' })).toMatchObject({
      description: 'Caption below the figure',
      label: 'Label',
      path: 'content.1.stats.0.label',
    })
  })

  it('does not resolve unmarked text fields', () => {
    expect(findAiGenerationField({ data, fields, path: 'slug' })).toBeNull()
    expect(findAiGenerationField({ data, fields, path: 'content.1.stats.0.value' })).toBeNull()
  })
})

describe('sanitizeAiContext', () => {
  it('redacts sensitive keys and limits long strings', () => {
    const sanitized = sanitizeAiContext({
      apiKey: 'sk-test',
      nested: {
        token: 'secret-token',
      },
      safe: 'x'.repeat(2100),
    }) as Record<string, unknown>

    expect(sanitized.apiKey).toBe('[Redacted]')
    expect((sanitized.nested as Record<string, unknown>).token).toBe('[Redacted]')
    expect(String(sanitized.safe)).toHaveLength(2003)
  })
})
