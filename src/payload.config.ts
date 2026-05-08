import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Windows } from './collections/Windows'
import { Works } from './collections/Works'
import { enforcePreDefinedEmailHook } from './hooks/forms/enforcePreDefinedEmail'
import { verifyRecaptchaHook } from './hooks/forms/verifyRecaptcha'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Windows, Works],
  editor: lexicalEditor(),
  email: resendAdapter({
    defaultFromAddress: 'noreply@dimm.co',
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
              admin: { description: 'Lock this field — defaultValue is used as the server-enforced value' },
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
        fields: ({ defaultFields }: { defaultFields: any[] }) => {
          const titleField = defaultFields.find((f: any) => f.name === 'title')
          const formFields = defaultFields.filter((f: any) => f.name !== 'title')
          return [
            titleField,
            {
              type: 'tabs',
              tabs: [
                {
                  label: 'Form',
                  fields: formFields,
                },
                {
                  label: 'Shortcut',
                  fields: [
                    {
                      name: 'slug',
                      type: 'text',
                      required: true,
                      unique: true,
                      index: true,
                      admin: {
                        description: 'Used as the URL path: /contact → /contact',
                      },
                      validate: (value: string) => {
                        if (!value) return 'Slug is required'
                        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
                          return 'Slug must be lowercase letters, numbers, and hyphens only'
                        return true
                      },
                    },
                    { name: 'showShortcut', type: 'checkbox', defaultValue: false },
                    { name: 'shortcutName', type: 'text' },
                    { name: 'shortcutIcon', type: 'text', defaultValue: 'ri-draft-fill' },
                    {
                      name: 'shortcutOrder',
                      type: 'number',
                      admin: {
                        description:
                          'Controls position across all shortcuts. Lower = earlier. Leave blank to append.',
                      },
                    },
                  ],
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
  ],
})
