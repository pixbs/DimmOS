import type { Payload, PayloadRequest } from 'payload'
import { createSeoImageContentSignature } from './signature'
import {
  deleteGeneratedSeoMetaImages,
  getRelationId,
  isGeneratedSeoMetaImage,
} from './media'
import type { GeneratedSeoMedia, SeoImageSourceCollection } from './types'
import { SEO_IMAGE_CONTEXT_SKIP } from './types'

type GenerateSeoMetaImageArgs = {
  collection: SeoImageSourceCollection
  deps?: {
    captureScreenshot?: (args: {
      origin: string
      source: { collection: SeoImageSourceCollection; id: number | string }
    }) => Promise<Buffer>
    now?: () => Date
  }
  doc: Record<string, unknown>
  force?: boolean
  req: PayloadRequest
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isSeoImageGenerationDisabled(): boolean {
  return process.env.SEO_IMAGE_GENERATION_DISABLED === 'true'
}

export function getSeoImageOrigin(req?: PayloadRequest): string {
  if (process.env.SEO_IMAGE_ORIGIN) return process.env.SEO_IMAGE_ORIGIN
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL

  const forwardedHost = req?.headers?.get('x-forwarded-host')
  const host = forwardedHost ?? req?.headers?.get('host')
  if (!host) return 'http://localhost:3000'

  const protocol = req?.headers?.get('x-forwarded-proto') ?? 'http'
  return `${protocol}://${host}`
}

async function defaultCaptureScreenshot(args: {
  origin: string
  source: { collection: SeoImageSourceCollection; id: number | string }
}) {
  const { captureSeoPreviewScreenshot } = await import('./screenshot')
  return captureSeoPreviewScreenshot(args)
}

async function getMediaDoc(
  payload: Payload,
  image: unknown,
): Promise<GeneratedSeoMedia | null> {
  if (isGeneratedSeoMetaImage(image)) return image

  const id = getRelationId(image)
  if (!id) return null

  try {
    return (await payload.findByID({
      collection: 'media',
      depth: 0,
      id,
      overrideAccess: true,
    })) as GeneratedSeoMedia
  } catch {
    return null
  }
}

export async function generateSeoMetaImage({
  collection,
  deps = {},
  doc,
  force = false,
  req,
}: GenerateSeoMetaImageArgs): Promise<number | string | null> {
  const meta = isRecord(doc.meta) ? doc.meta : {}
  if (isSeoImageGenerationDisabled()) return getRelationId(meta.image)

  const id = getRelationId(doc.id)
  if (!id) return null

  const payload = req.payload
  const source = { collection, id }
  const currentImage = meta.image
  const currentImageId = getRelationId(currentImage)
  const currentMedia = await getMediaDoc(payload, currentImage)
  const currentImageIsGenerated = isGeneratedSeoMetaImage(currentMedia)

  if (currentImageId && !currentImageIsGenerated && !force) {
    await deleteGeneratedSeoMetaImages(payload, source)
    return currentImageId
  }

  const signature = createSeoImageContentSignature(collection, doc)
  if (
    currentImageId &&
    currentImageIsGenerated &&
    currentMedia.seoGeneratedMetaImage?.contentSignature === signature &&
    !force
  ) {
    await deleteGeneratedSeoMetaImages(payload, source, { exceptId: currentImageId })
    return currentImageId
  }

  const captureScreenshot = deps.captureScreenshot ?? defaultCaptureScreenshot
  const now = deps.now ?? (() => new Date())
  const image = await captureScreenshot({
    origin: getSeoImageOrigin(req),
    source,
  })
  const timestamp = now()
  const generatedAt = timestamp.toISOString()
  const title = typeof doc.title === 'string' ? doc.title : String(id)
  const filename = `seo-${collection}-${id}-${signature.slice(0, 12)}-${timestamp.getTime()}.png`

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: `${title} Open Graph preview`,
      seoGeneratedMetaImage: {
        contentSignature: signature,
        generatedAt,
        sourceCollection: collection,
        sourceDocumentId: String(id),
      },
    },
    file: {
      data: image,
      mimetype: 'image/png',
      name: filename,
      size: image.length,
    },
    overrideAccess: true,
  })

  await payload.update({
    collection,
    context: { [SEO_IMAGE_CONTEXT_SKIP]: true },
    data: {
      meta: {
        ...meta,
        image: media.id,
      },
    },
    id,
    overrideAccess: true,
  })

  await deleteGeneratedSeoMetaImages(payload, source, { exceptId: media.id })

  return media.id
}
