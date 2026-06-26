import type { CookieSetting } from '@/payload-types'
import type { CookieServiceItem } from '@/app/(frontend)/(pages)/cookie-preferences/CookiePreferencesForm'

export type SystemWindowData = {
  cookieSettings: CookieSetting
  cookieServices: CookieServiceItem[]
}
