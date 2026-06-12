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
          const url = new URL(v ?? '')
          if (url.protocol !== 'https:' && url.protocol !== 'http:')
            return 'URL must use http or https'
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

const ArticleListBlock: Block = {
  slug: 'articleList',
  labels: { singular: 'Article List', plural: 'Article Lists' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: { placeholder: 'e.g. Our Services, Recent Work' },
    },
    {
      name: 'types',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['case-study', 'service'],
      options: [
        { label: 'Works (Case Studies)', value: 'case-study' },
        { label: 'Services', value: 'service' },
      ],
      admin: { description: 'Which article types to include in this list' },
    },
    {
      name: 'sortField',
      type: 'select',
      defaultValue: 'createdAt',
      options: [
        { label: 'Date Created', value: 'createdAt' },
        { label: 'Date Updated', value: 'updatedAt' },
        { label: 'Title', value: 'title' },
        { label: 'Manual Order', value: 'shortcutOrder' },
      ],
    },
    {
      name: 'sortDirection',
      type: 'select',
      defaultValue: 'desc',
      options: [
        { label: 'Descending (newest / Z→A)', value: 'desc' },
        { label: 'Ascending (oldest / A→Z)', value: 'asc' },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 50,
      admin: { description: 'Maximum number of articles to display' },
    },
  ],
}

export const contentBlocksField: Field = {
  name: 'content',
  type: 'blocks',
  blocks: [RichTextBlock, ImageBlock, GalleryBlock, EmbedBlock, CTABlock, ArticleListBlock],
}
