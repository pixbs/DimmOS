import type { Field } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { createAiGenerateFieldEndpoint } from '@/endpoints/ai-generate-field'
import { withAiGeneration } from '@/fields/ai-generation'

const fields: Field[] = [
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Content',
        fields: [
          withAiGeneration({ name: 'title', type: 'text', required: true }),
          { name: 'slug', type: 'text' },
        ],
      },
    ],
  },
]

function createReq(body: Record<string, unknown>, user: unknown = { id: 1 }) {
  return {
    json: async () => body,
    payload: {
      config: {
        collections: [{ fields, slug: 'windows' }],
        globals: [],
      },
      logger: {
        error: vi.fn(),
      },
    },
    user,
  }
}

describe('aiGenerateFieldEndpoint', () => {
  it('validates the requested field and returns generated text', async () => {
    const generateText = vi.fn().mockResolvedValue('Generated title')
    const endpoint = createAiGenerateFieldEndpoint(generateText)

    const response = await endpoint.handler(
      createReq({
        collectionSlug: 'windows',
        currentValue: 'Old title',
        doc: { slug: 'old-title', title: 'Old title' },
        fieldPath: 'title',
        id: 12,
        locale: 'en',
      }) as never,
    )

    await expect(response.json()).resolves.toEqual({ result: 'Generated title' })
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionSlug: 'windows',
        currentValue: 'Old title',
        id: 12,
        locale: 'en',
      }),
    )
    expect(generateText.mock.calls[0][0].field).toMatchObject({
      label: 'Title',
      path: 'title',
      type: 'text',
    })
  })

  it('rejects unauthenticated requests', async () => {
    const endpoint = createAiGenerateFieldEndpoint()

    await expect(
      endpoint.handler(
        createReq(
          {
            collectionSlug: 'windows',
            doc: { title: 'Old title' },
            fieldPath: 'title',
          },
          null,
        ) as never,
      ),
    ).rejects.toThrow(/Unauthorized/)
  })

  it('rejects fields that are not configured for AI generation', async () => {
    const endpoint = createAiGenerateFieldEndpoint()

    await expect(
      endpoint.handler(
        createReq({
          collectionSlug: 'windows',
          doc: { slug: 'old-title', title: 'Old title' },
          fieldPath: 'slug',
        }) as never,
      ),
    ).rejects.toThrow(/not configured/)
  })
})

