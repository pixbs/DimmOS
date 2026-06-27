import { after } from 'next/server'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { deleteGeneratedSeoMetaImages } from '@/lib/seo-image/media'
import { generateSeoMetaImage, isSeoImageGenerationDisabled } from '@/lib/seo-image/generation'
import { SEO_IMAGE_CONTEXT_SKIP, type SeoImageSourceCollection } from '@/lib/seo-image/types'

function scheduleAfterResponse(task: () => Promise<void>): void {
  try {
    after(task)
  } catch {
    setTimeout(() => {
      void task()
    }, 0)
  }
}

export function createGeneratedMetaImageHooks(collection: SeoImageSourceCollection): {
  afterChange: CollectionAfterChangeHook[]
  afterDelete: CollectionAfterDeleteHook[]
} {
  return {
    afterChange: [
      async ({ doc, req }) => {
        if (req.context[SEO_IMAGE_CONTEXT_SKIP] || isSeoImageGenerationDisabled()) return doc

        scheduleAfterResponse(async () => {
          try {
            await generateSeoMetaImage({
              collection,
              doc: doc as Record<string, unknown>,
              req,
            })
          } catch (error) {
            req.payload.logger.error({
              err: error,
              msg: `Failed to generate SEO meta image for ${collection}:${doc.id}`,
            })
          }
        })

        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await deleteGeneratedSeoMetaImages(req.payload, {
          collection,
          id: doc.id,
        })
        return doc
      },
    ],
  }
}
