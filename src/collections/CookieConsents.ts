import type { CollectionConfig } from 'payload'
import { captureRequestMetadataHook } from '../hooks/cookies/captureRequestMetadata'

export const CookieConsents: CollectionConfig = {
  slug: 'cookie-consents',
  admin: {
    useAsTitle: 'consentId',
    defaultColumns: ['consentId', 'categories', 'ipAddress', 'createdAt'],
    description: 'Audit log of all cookie consent events. Do not edit manually.',
  },
  access: {
    // All creates go through the /record custom endpoint with overrideAccess: true
    create: () => false,
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  hooks: {
    beforeChange: [captureRequestMetadataHook],
  },
  endpoints: [
    {
      path: '/record',
      method: 'post',
      handler: async (req) => {
        let body: Record<string, unknown>
        try {
          // req.json may be undefined in some Payload type versions; use text + parse as fallback
          const text = await (req.text?.() ?? req.body?.toString() ?? '{}')
          body = JSON.parse(text as string)
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        type Category = 'essential' | 'functional' | 'analytics' | 'marketing'
        const { consentId, categories, language, consentVersion } = body as {
          consentId?: string
          categories?: Category[]
          language?: string
          consentVersion?: string
        }

        if (!consentId || typeof consentId !== 'string') {
          return Response.json({ error: 'consentId is required' }, { status: 400 })
        }
        if (!Array.isArray(categories) || categories.length === 0) {
          return Response.json({ error: 'categories must be a non-empty array' }, { status: 400 })
        }

        const doc = await req.payload.create({
          collection: 'cookie-consents',
          data: { consentId, categories, language, consentVersion },
          overrideAccess: true,
          req,
        })

        return Response.json({ success: true, id: doc.id }, { status: 201 })
      },
    },
  ],
  fields: [
    {
      name: 'consentId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'UUID generated client-side. Each consent event (including updates) gets a fresh ID.',
      },
    },
    {
      name: 'categories',
      type: 'select',
      required: true,
      hasMany: true,
      options: [
        { label: 'Essential', value: 'essential' },
        { label: 'Functional', value: 'functional' },
        { label: 'Analytics', value: 'analytics' },
        { label: 'Marketing', value: 'marketing' },
      ],
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: { readOnly: true, description: 'Auto-captured from request headers' },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: { readOnly: true, description: 'Auto-captured from request headers' },
    },
    {
      name: 'language',
      type: 'text',
      admin: { description: 'Browser language (navigator.language)' },
    },
    {
      name: 'consentVersion',
      type: 'text',
      admin: { description: 'CookieSettings.consentVersion at time of consent' },
    },
  ],
}
