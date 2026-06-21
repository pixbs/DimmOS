import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { sentryPlugin } from '@payloadcms/plugin-sentry'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import * as Sentry from '@sentry/nextjs'
import path from 'path'
import { buildConfig, type Field } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import type { Article, Window as WindowDoc } from './payload-types'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Windows } from './collections/Windows'
import { Articles } from './collections/Articles'
import { Tags } from './collections/Tags'
import { CookieServices } from './collections/CookieServices'
import { CookieConsents } from './collections/CookieConsents'
import { CookieSettings } from './globals/CookieSettings'
import { enforcePreDefinedEmailHook } from './hooks/forms/enforcePreDefinedEmail'
import { verifyRecaptchaHook } from './hooks/forms/verifyRecaptcha'
import { windowBehaviorFields } from './fields/windowBehavior'
import { createSlugField } from './fields/slugField'
import { createShortcutFields } from './fields/shortcutFields'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const isVercelBlobStorageEnabled =
  Boolean(process.env.BLOB_READ_WRITE_TOKEN) && process.env.PAYLOAD_DISABLE_BLOB_STORAGE !== 'true'

const generateTitle: GenerateTitle<Article | WindowDoc> = ({ doc }) =>
  doc?.title ? `${doc.title} — Dimm's OS` : "Dimm's OS"

const generateURL: GenerateURL<Article | WindowDoc> = ({ doc }) => {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return doc?.slug ? `${base}/${doc.slug}` : base
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Windows, Articles, Tags, CookieServices, CookieConsents],
  globals: [CookieSettings],
  editor: lexicalEditor(),
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_DEFAULT_FROM_ADDRESS || 'noreply@dimm.co',
    defaultFromName: 'DimmOS',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: isVercelBlobStorageEnabled,
      collections: {
        media: true,
      },
      clientUploads: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
    formBuilderPlugin({
      fields: {
        text: {
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'label', type: 'text' },
            { name: 'placeholder', type: 'text' },
            { name: 'required', type: 'checkbox' },
            { name: 'defaultValue', type: 'text' },
          ],
        },
        textarea: {
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'label', type: 'text' },
            { name: 'placeholder', type: 'text' },
            { name: 'required', type: 'checkbox' },
            { name: 'defaultValue', type: 'text' },
          ],
        },
        email: {
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'label', type: 'text' },
            { name: 'placeholder', type: 'text' },
            { name: 'required', type: 'checkbox' },
            { name: 'defaultValue', type: 'text' },
            {
              name: 'isPreDefined',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Lock this field — default value is enforced on submit' },
            },
          ],
        },
        checkbox: false,
        select: false,
        number: false,
        message: false,
        country: false,
        state: false,
        payment: false,
      },
      formOverrides: {
        // Must be a function — the plugin ignores plain arrays
        fields: ({ defaultFields }: { defaultFields: Field[] }) => {
          const titleField = defaultFields.find((f) => 'name' in f && f.name === 'title')
          const formFields = defaultFields.filter((f) => !('name' in f && f.name === 'title'))
          return [
            ...(titleField ? [titleField] : []),
            createSlugField('Used as the URL path: /contact → /contact'),
            {
              type: 'tabs',
              tabs: [
                {
                  label: 'Form',
                  fields: formFields,
                },
                {
                  label: 'Shortcut',
                  fields: createShortcutFields('ri-draft-fill'),
                },
                {
                  label: 'Window',
                  fields: windowBehaviorFields,
                },
              ],
            },
          ]
        },
      },
      formSubmissionOverrides: {
        hooks: {
          beforeChange: [enforcePreDefinedEmailHook, verifyRecaptchaHook],
        },
      },
    }),
    sentryPlugin({ Sentry }),
    seoPlugin({
      collections: ['windows', 'articles'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle,
      generateURL,
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: 'noIndex',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Prevent search engines from indexing this page.' },
        },
      ],
    }),
  ],
})
