import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
let formId: number | string

describe('Forms access control', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const form = await payload.create({
      collection: 'forms',
      data: {
        title: 'Access Test Form',
        slug: 'test-form-access',
        fields: [{ blockType: 'text', name: 'name', label: 'Name' }],
        confirmationMessage: {
          root: {
            type: 'root',
            children: [
              { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Thanks' }] },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
      },
      overrideAccess: true,
    })
    formId = form.id
  })

  afterAll(async () => {
    await payload.delete({ collection: 'forms', id: formId, overrideAccess: true })
  })

  it('allows unauthenticated read (forms render publicly)', async () => {
    const { docs } = await payload.find({
      collection: 'forms',
      where: { id: { equals: formId } },
      overrideAccess: false,
    })
    expect(docs.length).toBe(1)
  })

  it('blocks unauthenticated create', async () => {
    await expect(
      payload.create({
        collection: 'forms',
        data: { title: 'No Auth Form', slug: 'test-form-no-auth' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('blocks unauthenticated read of form submissions', async () => {
    await expect(
      payload.find({
        collection: 'form-submissions',
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
