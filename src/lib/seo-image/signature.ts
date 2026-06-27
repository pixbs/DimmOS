import { createHash } from 'node:crypto'
import type { SeoImageSourceCollection } from './types'

type RecordValue = Record<string, unknown>

const WINDOW_BEHAVIOR_FIELDS = [
  'windowCollapsible',
  'windowExpandable',
  'windowResizable',
  'windowDisplaySearch',
  'windowDisplayViewToggle',
  'windowDefaultView',
  'windowDisplayHistory',
] as const

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function relationId(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(relationId)
  if (isRecord(value) && ('id' in value || 'value' in value)) {
    return 'id' in value ? value.id : relationId(value.value)
  }
  return value
}

function stableValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(stableValue)
  if (!isRecord(value)) return value

  const result: RecordValue = {}
  for (const key of Object.keys(value).sort()) {
    if (key === 'createdAt' || key === 'updatedAt') continue
    result[key] = stableValue(relationId(value[key]))
  }
  return result
}

function pickBehaviorFields(doc: RecordValue): RecordValue {
  const result: RecordValue = {}
  for (const field of WINDOW_BEHAVIOR_FIELDS) {
    result[field] = doc[field]
  }
  return result
}

export function getSeoImageSignatureInput(collection: SeoImageSourceCollection, doc: unknown) {
  const source = isRecord(doc) ? doc : {}
  const base = {
    collection,
    title: source.title,
    slug: source.slug,
    content: source.content,
    buttons: source.buttons,
    behavior: pickBehaviorFields(source),
  }

  if (collection === 'articles') {
    return stableValue({
      ...base,
      type: source.type,
      year: source.year,
      tags: relationId(source.tags),
      bgImage: relationId(source.bgImage),
      fgImage: relationId(source.fgImage),
    })
  }

  return stableValue(base)
}

export function createSeoImageContentSignature(
  collection: SeoImageSourceCollection,
  doc: unknown,
): string {
  return createHash('sha256')
    .update(JSON.stringify(getSeoImageSignatureInput(collection, doc)))
    .digest('hex')
}
