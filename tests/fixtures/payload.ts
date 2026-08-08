import config from '@/payload.config'
import type { Config } from '@/payload-types'
import { getPayload, type Payload } from 'payload'

type CollectionSlug = keyof Config['collections']
type Cleanup = () => Promise<void>

let payloadPromise: Promise<Payload> | undefined
let cleanups: Cleanup[] = []

export function getTestPayload(): Promise<Payload> {
  payloadPromise ??= getPayload({ config })
  return payloadPromise
}

export function uniqueValue(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function lexicalDocument(text: string) {
  return {
    root: {
      type: 'root' as const,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', version: 1, text }],
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

export function registerCleanup(cleanup: Cleanup): void {
  cleanups.push(cleanup)
}

export async function trackDocument(
  collection: CollectionSlug,
  id: number | string,
): Promise<void> {
  const payload = await getTestPayload()
  registerCleanup(async () => {
    await payload.delete({ collection, id, overrideAccess: true })
  })
}

export async function cleanupPayloadFixtures(): Promise<void> {
  const pending = cleanups.reverse()
  cleanups = []
  const failures: unknown[] = []

  for (const cleanup of pending) {
    try {
      await cleanup()
    } catch (error) {
      failures.push(error)
    }
  }

  if (failures.length) {
    throw new AggregateError(failures, 'Payload fixture cleanup failed')
  }
}
