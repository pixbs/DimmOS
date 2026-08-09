import { getPayload } from 'payload'
import config from '../payload.config.js'
import { cookieManifest } from '../data/cookieManifest.js'

export async function seedCookieServices() {
  const payload = await getPayload({ config })
  for (const item of cookieManifest) {
    await payload.delete({
      collection: 'cookie-services',
      where: { name: { equals: item.name } },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'cookie-services',
      data: item,
      overrideAccess: true,
    })
  }
}

export async function cleanupCookieServices() {
  const payload = await getPayload({ config })
  await payload.delete({
    collection: 'cookie-services',
    where: {
      name: {
        in: cookieManifest.map((item) => item.name),
      },
    },
    overrideAccess: true,
  })
}

