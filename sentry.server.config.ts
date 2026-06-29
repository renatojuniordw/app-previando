// Sentry Server Configuration
// This file configures the Sentry SDK for server-side error tracking.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2, // 20% of server transactions
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  ignoreErrors: [],
})
