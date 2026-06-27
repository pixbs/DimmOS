import type { PayloadRequest } from 'payload'

export const SEO_IMAGE_WIDTH = 1200
export const SEO_IMAGE_HEIGHT = 630
export const SEO_IMAGE_CONTEXT_SKIP = 'skipSeoImageGeneration'

export type SeoImageSourceCollection = 'windows' | 'articles'

export type SeoImageSource = {
  collection: SeoImageSourceCollection
  id: number | string
}

export type GeneratedSeoMetaImageInfo = {
  contentSignature?: string | null
  generatedAt?: string | null
  sourceCollection?: SeoImageSourceCollection | null
  sourceDocumentId?: string | null
}

export type GeneratedSeoMedia = {
  id: number | string
  seoGeneratedMetaImage?: GeneratedSeoMetaImageInfo | null
}

export type SeoImageGenerationRequest = PayloadRequest & {
  context: PayloadRequest['context'] & Record<string, unknown>
}
