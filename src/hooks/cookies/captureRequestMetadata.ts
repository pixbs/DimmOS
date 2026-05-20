import type { CollectionBeforeChangeHook } from 'payload'

export const captureRequestMetadataHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create') return data

  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null

  const userAgent = req.headers.get('user-agent') ?? null

  return {
    ...data,
    ipAddress: ip,
    userAgent,
  }
}
