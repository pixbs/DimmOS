import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  // Session replay is added lazily in SentryReplayProvider when functional consent is given
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
