/**
 * Sentry Utility Helpers
 *
 * Provides simplified helpers for manual error capturing
 * across frontend and backend code.
 */

let SentryModule: typeof import('@sentry/nextjs') | null = null

async function getSentry() {
  if (!SentryModule) {
    try {
      SentryModule = await import('@sentry/nextjs')
    } catch {
      return null
    }
  }
  return SentryModule
}

/**
 * Captures an exception to Sentry, safe to call even if Sentry is not configured.
 */
export async function captureException(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'production') return

  const sentry = await getSentry()
  if (!sentry) return

  const scope = new (await import('@sentry/nextjs')).Scope()
  if (context) {
    scope.setExtras(context)
  }
  sentry.captureException(error, scope)
}

/**
 * Sets the current user context for error tracking.
 */
export async function setSentryUser(userId: string, email?: string) {
  if (process.env.NODE_ENV !== 'production') return

  const sentry = await getSentry()
  if (!sentry) return

  sentry.setUser({ id: userId, email })
}

/**
 * Clears the current user context.
 */
export async function clearSentryUser() {
  if (process.env.NODE_ENV !== 'production') return

  const sentry = await getSentry()
  if (!sentry) return

  sentry.setUser(null)
}
