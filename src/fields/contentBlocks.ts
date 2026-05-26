import type { Block, Field } from 'payload'

const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Rich Text', plural: 'Rich Text Blocks' },
  fields: [{ name: 'content', type: 'richText' }],
}

const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: 'Image', plural: 'Images' },
  fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
}

const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    {
      name: 'images',
      type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
  ],
}

const EmbedBlock: Block = {
  slug: 'embed',
  labels: { singular: 'Embed', plural: 'Embeds' },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      validate: (v: string | null | undefined) => {
        try {
          new URL(v ?? '')
          return true
        } catch {
          return 'Must be a valid URL'
        }
      },
    },
  ],
}

const CTABlock: Block = {
  slug: 'cta',
  labels: { singular: 'CTA', plural: 'CTAs' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    {
      name: 'link',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
        { name: 'openInNewTab', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}

export const contentBlocksField: Field = {
  name: 'content',
  type: 'blocks',
  blocks: [RichTextBlock, ImageBlock, GalleryBlock, EmbedBlock, CTABlock],
}
