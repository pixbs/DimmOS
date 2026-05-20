import type { GlobalConfig } from 'payload'

export const CookieSettings: GlobalConfig = {
  slug: 'cookie-settings',
  label: 'Cookie Banner Settings',
  admin: {
    group: 'Settings',
    description: 'Configure the cookie consent banner shown to visitors.',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'We use cookies',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'We use cookies and similar technologies to make this site work and to understand how it is used. Essential cookies are required for the site to function. Optional cookies (analytics, functional, marketing) will only be set if you choose to allow them. You can update your preferences at any time.',
    },
    {
      name: 'consentVersion',
      type: 'text',
      defaultValue: '1.0',
      admin: {
        description:
          'Bump this value (e.g. "1.1", "2.0") to invalidate existing consents and re-ask all visitors.',
      },
    },
  ],
}
