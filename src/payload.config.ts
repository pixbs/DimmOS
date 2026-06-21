import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { sentryPlugin } from '@payloadcms/plugin-sentry'
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
import { withAiGeneration } from './fields/ai-generation'
import { aiGenerateFieldEndpoint } from './endpoints/ai-generate-field'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const generateTitle: GenerateTitle<Article | WindowDoc> = ({ doc }) =>
  doc?.title ? `${doc.title} — Dimm's OS` : "Dimm's OS"

const generateURL: GenerateURL<Article | WindowDoc> = ({ doc }) => {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return doc?.slug ? `${base}/${doc.slug}` : base
}

function withAiGenerationForSeoFields(defaultFields: Field[]): Field[] {
  return defaultFields.map((field) => {
    if (!('name' in field)) return field

    if (field.name === 'title' && field.type === 'text') {
      return withAiGeneration(field, {
        instruction:
          'Follow Google Search Central page title guidance: https://developers.google.com/search/docs/appearance/title-link#page-titles. Generate a descriptive, concise, unique page title from the full document context. The title must be 50-60 characters long, inclusive. Avoid keyword stuffing, vague text, repeated text, and boilerplate. Return only the title text.',
        maxOutputTokens: 80,
      })
    }

    if (field.name === 'description' && field.type === 'textarea') {
      return withAiGeneration(field, {
        instruction:
          'Follow Google Search Central meta description guidance: https://developers.google.com/search/docs/appearance/snippet#meta-descriptions. Generate a unique, page-specific, human-readable meta description from the full document context. The description must be 100-150 characters long, inclusive. Accurately summarize the page, include relevant concrete information, and avoid keyword lists or boilerplate. Return only the description text.',
        maxOutputTokens: 500,
      })
    }

    return field
  })
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  endpoints: [aiGenerateFieldEndpoint],
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
    formBuilderPlugin({
      fields: {
        text: {
          fields: [
            { name: 'name', type: 'text', required: true },
            withAiGeneration({ name: 'label', type: 'text' }),
            withAiGeneration({ name: 'placeholder', type: 'text' }),
            { name: 'required', type: 'checkbox' },
            withAiGeneration({ name: 'defaultValue', type: 'text' }),
          ],
        },
        textarea: {
          fields: [
            { name: 'name', type: 'text', required: true },
            withAiGeneration({ name: 'label', type: 'text' }),
            withAiGeneration({ name: 'placeholder', type: 'text' }),
            { name: 'required', type: 'checkbox' },
            withAiGeneration({ name: 'defaultValue', type: 'text' }),
          ],
        },
        email: {
          fields: [
            { name: 'name', type: 'text', required: true },
            withAiGeneration({ name: 'label', type: 'text' }),
            withAiGeneration({ name: 'placeholder', type: 'text' }),
            { name: 'required', type: 'checkbox' },
            withAiGeneration({ name: 'defaultValue', type: 'text' }),
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
          const aiTitleField =
            titleField && titleField.type === 'text' ? withAiGeneration(titleField) : titleField
          const formFields = defaultFields.filter((f) => !('name' in f && f.name === 'title'))
          return [
            ...(aiTitleField ? [aiTitleField] : []),
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
        ...withAiGenerationForSeoFields(defaultFields),
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
