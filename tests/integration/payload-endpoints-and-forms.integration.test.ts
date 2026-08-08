import type { User } from '@/payload-types'
import {
  createAiGenerateFieldEndpoint,
  generateClaudeFieldText,
} from '@/endpoints/ai-generate-field'
import { createLocalReq, type PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { getTestPayload, lexicalDocument, trackDocument, uniqueValue } from '../fixtures/payload'
import {
  anthropicState,
  resetAnthropicState,
} from '../stubs/node-anthropic'

async function createAdmin(): Promise<User> {
  const payload = await getTestPayload()
  const user = await payload.create({
    collection: 'users',
    data: {
      email: `${uniqueValue('endpoint-admin')}@example.test`,
      password: uniqueValue('password'),
    },
    overrideAccess: true,
  })
  await trackDocument('users', user.id)
  return user
}

async function cookieEndpointRequest(body: string, headers: HeadersInit = {}): Promise<PayloadRequest> {
  const payload = await getTestPayload()
  return createLocalReq(
    {
      req: {
        headers: new Headers(headers),
        text: async () => body,
      },
    },
    payload,
  )
}

describe('cookie consent endpoint', () => {
  it('validates JSON, records consent, and captures trusted request metadata', async () => {
    const payload = await getTestPayload()
    const collection = payload.config.collections.find((candidate) => candidate.slug === 'cookie-consents')
    const endpoints = Array.isArray(collection?.endpoints) ? collection.endpoints : []
    const endpoint = endpoints.find(
      (candidate) => candidate.path === '/record' && candidate.method === 'post',
    )
    if (!endpoint || typeof endpoint.handler !== 'function') {
      throw new Error('Cookie record endpoint is not configured')
    }
    const consentId = uniqueValue('consent')
    const req = await cookieEndpointRequest(
      JSON.stringify({
        consentId,
        categories: ['essential', 'analytics'],
        language: 'en-GB',
        consentVersion: '2.0',
      }),
      {
        'cf-connecting-ip': '203.0.113.8',
        'user-agent': 'Integration Browser/1.0',
      },
    )

    const response = await endpoint.handler(req)
    expect(response.status).toBe(201)
    const result = await response.json() as { id: number }
    await trackDocument('cookie-consents', result.id)

    const consent = await payload.findByID({
      collection: 'cookie-consents',
      id: result.id,
      overrideAccess: true,
    })
    expect(consent).toMatchObject({
      consentId,
      categories: ['essential', 'analytics'],
      language: 'en-GB',
      consentVersion: '2.0',
      ipAddress: '203.0.113.8',
      userAgent: 'Integration Browser/1.0',
    })

    const malformed = await endpoint.handler(await cookieEndpointRequest('{not-json'))
    expect(malformed.status).toBe(400)
    await expect(malformed.json()).resolves.toEqual({ error: 'Invalid JSON body' })

    const missingCategories = await endpoint.handler(
      await cookieEndpointRequest(JSON.stringify({ consentId: uniqueValue('empty-consent') })),
    )
    expect(missingCategories.status).toBe(400)
  })

  it('enforces unique consent identifiers and authenticated audit-log access', async () => {
    const payload = await getTestPayload()
    const admin = await createAdmin()
    const consentId = uniqueValue('unique-consent')
    await expect(
      payload.create({
        collection: 'cookie-consents',
        data: { consentId, categories: ['essential'] },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const consent = await payload.create({
      collection: 'cookie-consents',
      data: { consentId, categories: ['essential'] },
      overrideAccess: true,
    })
    await trackDocument('cookie-consents', consent.id)
    await expect(
      payload.create({
        collection: 'cookie-consents',
        data: { consentId, categories: ['essential'] },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    await expect(
      payload.find({ collection: 'cookie-consents', overrideAccess: false }),
    ).rejects.toThrow()

    await expect(
      payload.update({
        collection: 'cookie-consents',
        id: consent.id,
        data: { language: 'blocked' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    const updated = await payload.update({
      collection: 'cookie-consents',
      id: consent.id,
      data: { language: 'de-DE' },
      overrideAccess: false,
      user: admin,
    })
    expect(updated.language).toBe('de-DE')

    await expect(
      payload.delete({
        collection: 'cookie-consents',
        id: consent.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    const deletable = await payload.create({
      collection: 'cookie-consents',
      data: {
        consentId: uniqueValue('deletable-consent'),
        categories: ['essential'],
      },
      overrideAccess: true,
    })
    const deleted = await payload.delete({
      collection: 'cookie-consents',
      id: deletable.id,
      overrideAccess: false,
      user: admin,
    })
    expect(deleted.id).toBe(deletable.id)
  })
})

describe('form submission hooks and access', () => {
  it('publishes forms, protects form data, enforces locked email, and verifies reCAPTCHA', async () => {
    const payload = await getTestPayload()
    const form = await payload.create({
      collection: 'forms',
      data: {
        title: 'Integration contact form',
        slug: uniqueValue('contact-form'),
        fields: [
          {
            blockType: 'email',
            name: 'email',
            label: 'Email',
            isPreDefined: true,
            defaultValue: 'owner@example.test',
          },
          { blockType: 'text', name: 'subject', label: 'Subject' },
        ],
        confirmationMessage: lexicalDocument('Thank you for your message.'),
      },
      overrideAccess: true,
    })
    await trackDocument('forms', form.id)

    const publicForm = await payload.findByID({
      collection: 'forms',
      id: form.id,
      overrideAccess: false,
    })
    expect(publicForm.slug).toBe(form.slug)
    await expect(
      payload.create({
        collection: 'forms',
        data: { title: 'Anonymous form', slug: uniqueValue('anonymous-form') },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const verification = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      Response.json({ success: true, score: 0.9 }),
    )
    vi.stubGlobal('fetch', verification)
    const submission = await payload.create({
      collection: 'form-submissions',
      data: {
        form: form.id,
        submissionData: [
          { field: 'email', value: 'attacker@example.test' },
          { field: 'subject', value: 'Real inquiry' },
          { field: 'recaptchaToken', value: 'controlled-token' },
        ],
      },
      overrideAccess: true,
    })
    await trackDocument('form-submissions', submission.id)

    expect(verification).toHaveBeenCalledOnce()
    expect(String(verification.mock.calls[0]?.[0])).toBe(
      'https://www.google.com/recaptcha/api/siteverify',
    )
    expect(submission.submissionData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email', value: 'owner@example.test' }),
        expect.objectContaining({ field: 'subject', value: 'Real inquiry' }),
      ]),
    )
    expect(submission.submissionData).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'recaptchaToken' })]),
    )
    await expect(
      payload.find({ collection: 'form-submissions', overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('rejects missing and low-confidence reCAPTCHA responses without storing submissions', async () => {
    const payload = await getTestPayload()
    const form = await payload.create({
      collection: 'forms',
      data: {
        title: 'Captcha contract',
        slug: uniqueValue('captcha-form'),
        confirmationMessage: lexicalDocument('Submission received.'),
      },
      overrideAccess: true,
    })
    await trackDocument('forms', form.id)

    await expect(
      payload.create({
        collection: 'form-submissions',
        data: { form: form.id, submissionData: [] },
        overrideAccess: true,
      }),
    ).rejects.toThrow('reCAPTCHA token missing')

    const verification = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      Response.json({ success: true, score: 0.2 }),
    )
    vi.stubGlobal('fetch', verification)
    await expect(
      payload.create({
        collection: 'form-submissions',
        data: {
          form: form.id,
          submissionData: [{ field: 'recaptchaToken', value: 'low-score' }],
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow('reCAPTCHA verification failed')
  })
})

describe('AI field endpoint', () => {
  it('uses the sanitized production field config and returns controlled generated text', async () => {
    const payload = await getTestPayload()
    const user = await createAdmin()
    const generateText = vi.fn(async () => 'Generated production title')
    const endpoint = createAiGenerateFieldEndpoint(generateText)
    const req = await createLocalReq(
      {
        user,
        req: {
          json: async () => ({
            collectionSlug: 'windows',
            currentValue: 'Old title',
            doc: { title: 'Old title', slug: 'old-title' },
            fieldPath: 'title',
            id: 17,
            locale: 'en',
          }),
        },
      },
      payload,
    )

    const response = await endpoint.handler(req)
    await expect(response.json()).resolves.toEqual({ result: 'Generated production title' })
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionSlug: 'windows',
        currentValue: 'Old title',
        id: 17,
        locale: 'en',
        field: expect.objectContaining({ path: 'title', type: 'text' }),
      }),
    )
  })

  it('rejects unauthenticated, malformed, unknown, and non-AI field requests', async () => {
    const payload = await getTestPayload()
    const endpoint = createAiGenerateFieldEndpoint(vi.fn())
    const request = async (body: unknown, user?: User) =>
      createLocalReq({ user, req: { json: async () => body } }, payload)

    await expect(
      endpoint.handler(await request({ collectionSlug: 'windows', fieldPath: 'title' })),
    ).rejects.toThrow('Unauthorized')

    const admin = await createAdmin()
    await expect(endpoint.handler(await request({}, admin))).rejects.toThrow('fieldPath is required')
    await expect(
      endpoint.handler(
        await request({ collectionSlug: 'windows', globalSlug: 'cookie-settings', fieldPath: 'title' }, admin),
      ),
    ).rejects.toThrow('either collectionSlug or globalSlug')
    await expect(
      endpoint.handler(await request({ fieldPath: 'title' }, admin)),
    ).rejects.toThrow('collectionSlug or globalSlug is required')
    await expect(
      endpoint.handler(
        await request({ collectionSlug: 'unknown', fieldPath: 'title', doc: {} }, admin),
      ),
    ).rejects.toThrow('Collection not found')
    await expect(
      endpoint.handler(
        await request({ collectionSlug: 'windows', fieldPath: 'slug', doc: {} }, admin),
      ),
    ).rejects.toThrow('not configured for AI generation')

    await expect(
      endpoint.handler({ payload, user: admin } as never),
    ).rejects.toThrow('JSON request body is required')
  })

  it('normalizes Claude text, token limits, provider configuration, and provider failures', async () => {
    resetAnthropicState()
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    await expect(
      generateClaudeFieldText({
        currentValue: '',
        doc: {},
        field: { path: 'title', type: 'text', maxOutputTokens: 12 },
      } as never),
    ).rejects.toThrow('Anthropic API key is not configured')

    vi.stubEnv('ANTHROPIC_API_KEY', 'controlled-key')
    anthropicState.response = {
      content: [
        { type: 'tool_use' },
        { type: 'text', text: '  First line  ' },
        { type: 'text', text: 'Second line' },
      ],
    }
    const generated = await generateClaudeFieldText({
      currentValue: 'Old value',
      doc: { title: 'Context' },
      field: { path: 'title', type: 'text', maxOutputTokens: 12 },
      collectionSlug: 'windows',
    } as never)
    expect(generated).toBe('First line  \nSecond line')
    expect(anthropicState.calls[0]).toMatchObject({ max_tokens: 64 })

    anthropicState.response = { content: [] }
    await expect(
      generateClaudeFieldText({
        currentValue: '',
        doc: {},
        field: { path: 'description', type: 'textarea', maxOutputTokens: 5000 },
      } as never),
    ).rejects.toThrow('Claude returned an empty response')

  })

  it('normalizes unexpected generation failures without exposing provider details', async () => {
    const payload = await getTestPayload()
    const admin = await createAdmin()
    const logger = vi.spyOn(payload.logger, 'error').mockImplementation(() => undefined)
    const endpoint = createAiGenerateFieldEndpoint(async () => {
      throw new Error('private provider detail')
    })
    const req = await createLocalReq(
      {
        user: admin,
        req: {
          json: async () => ({
            collectionSlug: 'windows',
            doc: { title: 'Context' },
            fieldPath: 'title',
          }),
        },
      },
      payload,
    )

    await expect(endpoint.handler(req)).rejects.toThrow('AI generation failed')
    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'AI field generation failed',
    )
  })
})
