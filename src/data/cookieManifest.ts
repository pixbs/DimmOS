type CookieEntry = {
  storageType: 'cookie' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'other'
  name: string
  duration: string
  description: string
}

type ServiceEntry = {
  name: string
  category: 'essential' | 'functional' | 'analytics' | 'marketing'
  description?: string
  legalName?: string
  privacyPolicyUrl?: string
  cookies: CookieEntry[]
}

export const cookieManifest: ServiceEntry[] = [
  {
    name: 'Cookie Consent',
    category: 'essential',
    description: 'Stores your cookie preferences to avoid showing the consent banner on every visit.',
    cookies: [
      {
        storageType: 'localStorage',
        name: 'cookie-consent',
        duration: '6 months',
        description: 'Your consent choices and the version of the policy you agreed to.',
      },
    ],
  },
  {
    name: 'Window Positions',
    category: 'functional',
    description: 'Remembers the position and size of desktop windows so they reopen in the same place on your next visit.',
    cookies: [
      {
        storageType: 'localStorage',
        name: 'window-positions',
        duration: 'Persistent',
        description: 'Saved window position and size for each page slug.',
      },
    ],
  },
  {
    name: 'Open Windows State',
    category: 'functional',
    description: 'Remembers which desktop windows are open during your current browser session.',
    cookies: [
      {
        storageType: 'sessionStorage',
        name: 'open-windows',
        duration: 'Session',
        description: 'List of currently open secondary windows (slug, zIndex, minimized state).',
      },
    ],
  },
  {
    name: 'reCAPTCHA',
    category: 'essential',
    description: 'Google reCAPTCHA v3 protects contact forms from automated spam and abuse without requiring user interaction.',
    legalName: 'Google LLC',
    privacyPolicyUrl: 'https://policies.google.com/privacy',
    cookies: [
      {
        storageType: 'cookie',
        name: '_grecaptcha',
        duration: 'Session',
        description: 'reCAPTCHA security token used to verify that form submissions come from a human.',
      },
    ],
  },
  {
    name: 'PostHog Analytics',
    category: 'analytics',
    description: 'Open-source product analytics used to understand how visitors use the site. No data is sold to third parties.',
    legalName: 'PostHog, Inc.',
    privacyPolicyUrl: 'https://posthog.com/privacy',
    cookies: [
      {
        storageType: 'localStorage',
        name: 'ph_*',
        duration: 'Persistent',
        description: 'PostHog session identity and captured event data.',
      },
      {
        storageType: 'localStorage',
        name: '__ph_*',
        duration: 'Persistent',
        description: 'PostHog opt-in / opt-out state (double-underscore prefix variant).',
      },
      {
        storageType: 'cookie',
        name: 'ph_*',
        duration: '1 year',
        description: 'PostHog persistence cookie and opt-in / opt-out state.',
      },
    ],
  },
  {
    name: 'Sentry Error Tracking',
    category: 'functional',
    description:
      'Captures JavaScript errors and, when functional cookies are accepted, session recordings to help diagnose and fix bugs.',
    legalName: 'Functional Software, Inc.',
    privacyPolicyUrl: 'https://sentry.io/privacy/',
    cookies: [],
  },
]
