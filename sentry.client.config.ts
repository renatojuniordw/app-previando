// Sentry Client Configuration
// This file configures the Sentry SDK for browser-side error tracking.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions for cost control
  replaysSessionSampleRate: 0.05, // 5% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of errors
  environment: process.env.NODE_ENV,
  // Only send errors in production by default
  enabled: process.env.NODE_ENV === 'production',
  // Ignore known non-actionable errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    'Failed to fetch',
    'ChunkLoadError',
  ],
  // Integrations
  integrations: [],
})
