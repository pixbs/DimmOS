import type { CollectionConfig } from 'payload'

export const CookieServices: CollectionConfig = {
  slug: 'cookie-services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'legalName', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Essential', value: 'essential' },
        { label: 'Functional', value: 'functional' },
        { label: 'Analytics', value: 'analytics' },
        { label: 'Marketing', value: 'marketing' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'legalName',
      type: 'text',
      admin: {
        description: 'Legal entity name, e.g. "Google LLC"',
      },
    },
    {
      name: 'privacyPolicyUrl',
      type: 'text',
      admin: {
        description: 'Link to the service privacy policy',
      },
    },
    {
      name: 'cookies',
      type: 'array',
      labels: {
        singular: 'Cookie / Storage Item',
        plural: 'Cookies / Storage Items',
      },
      fields: [
        {
          name: 'storageType',
          type: 'select',
          options: [
            { label: 'Cookie', value: 'cookie' },
            { label: 'localStorage', value: 'localStorage' },
            { label: 'sessionStorage', value: 'sessionStorage' },
            { label: 'IndexedDB', value: 'indexedDB' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'name',
          type: 'text',
          admin: {
            description: 'e.g. _grecaptcha, _ph_opt_in_out_*, _ga',
          },
        },
        {
          name: 'duration',
          type: 'text',
          admin: {
            description: 'e.g. "1 year", "Session", "Persistent"',
          },
        },
        {
          name: 'description',
          type: 'text',
          admin: {
            description: 'What this specific cookie/item is used for',
          },
        },
      ],
    },
  ],
}
