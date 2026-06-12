import { getPayload } from 'payload'
import config from '@payload-config'
import { CookiePreferencesForm } from './CookiePreferencesForm'

export const metadata = {
  title: 'Cookie Preferences',
}

export default async function CookiePreferencesPage() {
  const payload = await getPayload({ config })

  const [{ docs: services }, settings] = await Promise.all([
    payload.find({ collection: 'cookie-services', limit: 100, depth: 0, overrideAccess: false }),
    payload.findGlobal({ slug: 'cookie-settings', overrideAccess: false }),
  ])

  return <CookiePreferencesForm services={services} settings={settings} />
}
