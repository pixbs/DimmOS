import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  AI_GENERATE_FIELD_COMPONENT,
  findAiGenerationField,
  sanitizeAiContext,
  withAiGeneration,
} from '@/fields/ai-generation'

function fields(value: unknown[]): Field[] {
  return value as Field[]
}

describe('AI generation field configuration', () => {
  it('adds generation metadata without discarding existing admin configuration', () => {
    const field = withAiGeneration(
      {
        name: 'summary',
        type: 'textarea',
        admin: { description: 'Short summary', components: { beforeInput: ['existing'] } },
        custom: { owner: 'content' },
      } as Field,
      { instruction: 'Use a direct tone', maxOutputTokens: 300 },
    ) as Field & { admin: Record<string, unknown>; custom: Record<string, unknown> }

    expect(field.admin).toMatchObject({
      description: 'Short summary',
      components: {
        beforeInput: ['existing'],
        afterInput: {
          clientProps: { instruction: 'Use a direct tone' },
          path: AI_GENERATE_FIELD_COMPONENT,
        },
      },
    })
    expect(field.custom).toMatchObject({
      owner: 'content',
      aiGeneration: { enabled: true, instruction: 'Use a direct tone', maxOutputTokens: 300 },
    })
  })

  it('rejects fields that cannot receive generated text', () => {
    expect(() => withAiGeneration({ name: 'published', type: 'checkbox' } as Field)).toThrow(
      'AI generation can only be attached to text or textarea fields',
    )
  })
})

describe('AI generation field discovery', () => {
  it('returns descriptive metadata for a direct field', () => {
    const title = withAiGeneration({
      name: 'metaTitle',
      type: 'text',
      label: { en: 'Search title' },
      admin: { description: { en: 'Visible in results' }, placeholder: 123 },
    } as Field)

    expect(findAiGenerationField({ fields: [title], data: {}, path: 'metaTitle' })).toMatchObject({
      description: 'Visible in results',
      label: 'Search title',
      path: 'metaTitle',
      placeholder: '123',
      type: 'text',
    })
  })

  it('humanizes an unlabeled nested group field', () => {
    const nested = withAiGeneration({ name: 'callToAction', type: 'text' } as Field, {
      instruction: 'Be concise',
    })
    const result = findAiGenerationField({
      fields: fields([{ name: 'meta', type: 'group', fields: [nested] }]),
      data: { meta: {} },
      path: 'meta.callToAction',
    })

    expect(result).toMatchObject({
      instruction: 'Be concise',
      label: 'Call To Action',
      path: 'meta.callToAction',
    })
  })

  it('traverses named tabs and array rows using the submitted data path', () => {
    const caption = withAiGeneration({ name: 'caption_text', type: 'textarea' } as Field)
    const result = findAiGenerationField({
      fields: fields([
        {
          type: 'tabs',
          tabs: [
            {
              name: 'content',
              fields: [{ name: 'items', type: 'array', fields: [caption] }],
            },
          ],
        },
      ]),
      data: { content: { items: [{ caption_text: '' }] } },
      path: 'content.items.0.caption_text',
    })

    expect(result).toMatchObject({ label: 'Caption text', path: 'content.items.0.caption_text' })
  })

  it('traverses the selected block and ignores an unknown block type', () => {
    const headline = withAiGeneration({ name: 'headline', type: 'text' } as Field)
    const blockField = {
      name: 'sections',
      type: 'blocks',
      blocks: [{ slug: 'hero', fields: [headline] }],
    }
    expect(
      findAiGenerationField({
        fields: fields([blockField]),
        data: { sections: [{ blockType: 'hero' }] },
        path: 'sections.0.headline',
      }),
    ).toMatchObject({ path: 'sections.0.headline' })
    expect(
      findAiGenerationField({
        fields: fields([blockField]),
        data: { sections: [{ blockType: 'missing' }] },
        path: 'sections.0.headline',
      }),
    ).toBeNull()
  })

  it('returns no match for empty, malformed, disabled, or unsupported paths', () => {
    expect(findAiGenerationField({ fields: [], data: {}, path: '' })).toBeNull()
    expect(
      findAiGenerationField({
        fields: fields([{ name: 'title', type: 'text' }]),
        data: {},
        path: 'title',
      }),
    ).toBeNull()
    expect(
      findAiGenerationField({
        fields: fields([{ name: 'items', type: 'array', fields: [] }]),
        data: { items: [] },
        path: 'items.nope.title',
      }),
    ).toBeNull()
  })
})

describe('AI context sanitization', () => {
  it('redacts credentials, truncates large values, and normalizes dates', () => {
    const longText = 'x'.repeat(2_050)
    expect(
      sanitizeAiContext({
        title: longText,
        password: 'visible only to the server',
        nested: { authorization: 'bearer value', date: new Date('2026-02-03T04:05:06Z') },
      }),
    ).toEqual({
      title: `${'x'.repeat(2_000)}...`,
      password: '[Redacted]',
      nested: { authorization: '[Redacted]', date: '2026-02-03T04:05:06.000Z' },
    })
  })

  it('limits collection size and recursion depth', () => {
    const values = Array.from({ length: 60 }, (_, index) => index)
    expect(sanitizeAiContext(values)).toEqual(values.slice(0, 50))

    let deep: unknown = 'bottom'
    for (let index = 0; index < 10; index += 1) deep = { child: deep }
    expect(JSON.stringify(sanitizeAiContext(deep))).toContain('[Max depth reached]')
  })

  it.each([null, undefined, true, 42])('preserves scalar %#', (value) => {
    expect(sanitizeAiContext(value)).toBe(value)
  })

  it('stringifies non-record objects', () => {
    function exampleFunction() {}
    expect(sanitizeAiContext(exampleFunction)).toContain('exampleFunction')
  })
})
