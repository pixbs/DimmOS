import type { Block, Field } from 'payload'
import { withAiGeneration } from './ai-generation'

// Content section blocks shared by the Articles and Windows collections.
//
// `richText` and `articleList` are general-purpose; the remaining blocks are
// the case-study layout sections. `hero` is article-only (it pairs with the
// article-level bg/fg images) and is added by the factory below only when
// `article: true`. All blocks declare an `interfaceName` so the generated
// `Article['content']`/`Window['content']` unions reuse the same types.

const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich Text', plural: 'Rich Text Blocks' },
  fields: [{ name: 'content', type: 'richText' }],
}

const ArticleListBlock: Block = {
  slug: 'articleList',
  interfaceName: 'ArticleListBlock',
  labels: { singular: 'Works / Article List', plural: 'Works / Article Lists' },
  imageURL: '/block-previews/articleList.png',
  imageAltText: 'Preview of the Works grid/table section',
  fields: [
    withAiGeneration({
      name: 'heading',
      type: 'text',
      admin: { placeholder: 'e.g. Our Services, Recent Work' },
    }),
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

// ─── Case-study layout sections ───

/** Hero: title + description beside a 2/3-width parallax image (article bg/fg pair). */
const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Heroes' },
  imageURL: '/block-previews/hero.png',
  imageAltText: 'Preview of the Hero section',
  fields: [
    withAiGeneration({ name: 'title', type: 'text', required: true }),
    withAiGeneration({ name: 'description', type: 'textarea' }),
  ],
}

/** Summary: a narrow (1/3) title+body column beside a wide (2/3) title+body column. */
const SummaryBlock: Block = {
  slug: 'summary',
  interfaceName: 'SummaryBlock',
  labels: { singular: 'Summary', plural: 'Summaries' },
  imageURL: '/block-previews/summary.png',
  imageAltText: 'Preview of the Summary section',
  fields: [
    withAiGeneration({ name: 'leftTitle', type: 'text' }),
    withAiGeneration({ name: 'leftBody', type: 'textarea' }),
    withAiGeneration({ name: 'rightTitle', type: 'text' }),
    withAiGeneration({ name: 'rightBody', type: 'textarea' }),
  ],
}

/** Stats: up to three large count-up figures, each a single string and a label. */
const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: 'Stats', plural: 'Stats' },
  imageURL: '/block-previews/stats.png',
  imageAltText: 'Preview of the Stats section',
  fields: [
    {
      name: 'stats',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      admin: { description: 'Up to three large figures shown side by side' },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: {
            description:
              'The figure as a single string, e.g. "30Mil", "$30,000", "21%". The number animates; surrounding text stays static.',
          },
        },
        withAiGeneration({
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'Caption below the figure' },
        }),
      ],
    },
  ],
}

/** Image: a single full-width image rendered with the de-pixelation reveal. */
const ImageSectionBlock: Block = {
  slug: 'imageSection',
  interfaceName: 'ImageSectionBlock',
  labels: { singular: 'Image', plural: 'Images' },
  imageURL: '/block-previews/imageSection.png',
  imageAltText: 'Preview of the full-width Image section',
  fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
}

/** Description: a 1/3-width big title beside 2/3-width rich text. */
const DescriptionBlock: Block = {
  slug: 'description',
  interfaceName: 'DescriptionBlock',
  labels: { singular: 'Description', plural: 'Descriptions' },
  imageURL: '/block-previews/description.png',
  imageAltText: 'Preview of the Description section',
  fields: [
    withAiGeneration({ name: 'title', type: 'text', required: true }),
    { name: 'body', type: 'richText' },
  ],
}

/** Title: an animated title with a supporting description. */
const TitleBlock: Block = {
  slug: 'sectionTitle',
  interfaceName: 'TitleBlock',
  labels: { singular: 'Title', plural: 'Titles' },
  imageURL: '/block-previews/sectionTitle.png',
  imageAltText: 'Preview of the Title section',
  fields: [
    withAiGeneration({ name: 'title', type: 'text', required: true }),
    withAiGeneration({ name: 'description', type: 'textarea' }),
  ],
}

/** Blocks available to every content collection (Articles and Windows). */
const sharedBlocks: Block[] = [
  RichTextBlock,
  ArticleListBlock,
  SummaryBlock,
  StatsBlock,
  ImageSectionBlock,
  DescriptionBlock,
  TitleBlock,
]

/** Blocks available only to Articles (adds the doc-image-backed Hero). */
const articleBlocks: Block[] = [HeroBlock, ...sharedBlocks]

/**
 * Build the `content` blocks field for a content collection.
 *
 * @param opts.article - When `true`, includes the article-only Hero block.
 *   Windows omit it because the Hero relies on the article-level bg/fg images.
 */
export function createContentBlocksField(opts: { article?: boolean } = {}): Field {
  return {
    name: 'content',
    type: 'blocks',
    blocks: opts.article ? articleBlocks : sharedBlocks,
  }
}
