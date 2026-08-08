import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { buildGenerateFieldPrompt } from '@/endpoints/ai-generate-field'
import { withAiGeneration } from '@/fields/ai-generation'
import { createSlugField, validateSlug } from '@/fields/slugField'
import { isSeoImageGenerationDisabled, getSeoImageOrigin } from '@/lib/seo-image/generation'
import { extractBehavior } from '@/utilities/windowBehavior'

describe('CMS field contracts', () => {
  it.each([
    ['about', true],
    ['case-study-2', true],
    ['', 'Slug is required'],
    [null, 'Slug is required'],
    ['About', 'Slug must be lowercase letters, numbers, and hyphens only'],
    ['two--parts', 'Slug must be lowercase letters, numbers, and hyphens only'],
  ])('validates slug %#', (value, expected) => {
    expect(validateSlug(value)).toBe(expected)
  })

  it('builds the shared indexed and unique slug field', () => {
    expect(createSlugField('Used in the public URL.')).toEqual({
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Used in the public URL.' },
      validate: validateSlug,
    })
  })

  it('serializes a redacted, structured generation prompt', () => {
    const field = withAiGeneration({ name: 'summary', type: 'textarea' } as Field, {
      instruction: 'One sentence',
    })
    const prompt = buildGenerateFieldPrompt({
      collectionSlug: 'articles',
      currentValue: 'Old copy',
      doc: { title: 'Launch', apiKey: 'private' },
      field: {
        field,
        instruction: 'One sentence',
        label: 'Summary',
        path: 'summary',
        type: 'textarea',
      },
      id: 42,
      locale: 'en',
    })

    expect(JSON.parse(prompt)).toMatchObject({
      currentValue: 'Old copy',
      documentContext: { title: 'Launch', apiKey: '[Redacted]' },
      entity: { collectionSlug: 'articles', id: 42, locale: 'en' },
      field: { instruction: 'One sentence', label: 'Summary', path: 'summary' },
    })
  })
})

describe('window behavior defaults', () => {
  it('preserves the product defaults when optional CMS fields are absent', () => {
    expect(extractBehavior({})).toEqual({
      collapsible: true,
      expandable: false,
      resizable: true,
      displaySearch: false,
      displayViewToggle: false,
      defaultView: 'grid',
      displayHistory: false,
    })
  })

  it('maps explicit behavior values without coercing unrelated truthy values', () => {
    expect(
      extractBehavior({
        windowCollapsible: false,
        windowExpandable: true,
        windowResizable: false,
        windowDisplaySearch: true,
        windowDisplayViewToggle: true,
        windowDefaultView: 'table',
        windowDisplayHistory: true,
      }),
    ).toEqual({
      collapsible: false,
      expandable: true,
      resizable: false,
      displaySearch: true,
      displayViewToggle: true,
      defaultView: 'table',
      displayHistory: true,
    })
  })
})

describe('SEO generation environment behavior', () => {
  it('uses explicit origins before request headers', () => {
    const previousOrigin = process.env.SEO_IMAGE_ORIGIN
    process.env.SEO_IMAGE_ORIGIN = 'https://render.example.test'
    expect(getSeoImageOrigin()).toBe('https://render.example.test')
    if (previousOrigin === undefined) delete process.env.SEO_IMAGE_ORIGIN
    else process.env.SEO_IMAGE_ORIGIN = previousOrigin
  })

  it('honors the generation kill switch literally', () => {
    const previous = process.env.SEO_IMAGE_GENERATION_DISABLED
    process.env.SEO_IMAGE_GENERATION_DISABLED = 'true'
    expect(isSeoImageGenerationDisabled()).toBe(true)
    process.env.SEO_IMAGE_GENERATION_DISABLED = 'false'
    expect(isSeoImageGenerationDisabled()).toBe(false)
    if (previous === undefined) delete process.env.SEO_IMAGE_GENERATION_DISABLED
    else process.env.SEO_IMAGE_GENERATION_DISABLED = previous
  })
})
