import type { Payload } from 'payload'
import type { GeneratedSeoMedia, SeoImageSource } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function getRelationId(value: unknown): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (!isRecord(value)) return null
  if (typeof value.id === 'number' || typeof value.id === 'string') return value.id
  return getRelationId(value.value)
}

export function isGeneratedSeoMetaImage(value: unknown): value is GeneratedSeoMedia {
  if (!isRecord(value)) return false
  const info = value.seoGeneratedMetaImage
  if (!isRecord(info)) return false
  return Boolean(info.sourceCollection && info.sourceDocumentId)
}

export async function findGeneratedSeoMetaImages(
  payload: Payload,
  source: SeoImageSource,
): Promise<GeneratedSeoMedia[]> {
  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: {
      and: [
        { 'seoGeneratedMetaImage.sourceCollection': { equals: source.collection } },
        { 'seoGeneratedMetaImage.sourceDocumentId': { equals: String(source.id) } },
      ],
    },
  })

  return result.docs as GeneratedSeoMedia[]
}

export async function deleteGeneratedSeoMetaImages(
  payload: Payload,
  source: SeoImageSource,
  options: { exceptId?: number | string | null } = {},
): Promise<number[]> {
  const docs = await findGeneratedSeoMetaImages(payload, source)
  const deletedIds: number[] = []
  const exceptId = options.exceptId === undefined ? null : String(options.exceptId)

  for (const doc of docs) {
    if (exceptId && String(doc.id) === exceptId) continue
    await payload.delete({
      collection: 'media',
      id: doc.id,
      overrideAccess: true,
    })
    if (typeof doc.id === 'number') deletedIds.push(doc.id)
  }

  return deletedIds
}
