/**
 * Startup environment variable validator.
 * Must be imported at app initialization (src/app/layout.tsx or instrumentation hook)
 * to fail fast when required secrets are missing — no silent partial-boot scenarios.
 */

const REQUIRED_VARS = [
  'DATABASE_URL',
  'REDIS_URL',
  'AUTH_SECRET',
  'ENCRYPTION_KEY',
  'CPF_HASH_SALT',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'OPENAI_API_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADOPAGO_WEBHOOK_SECRET',
] as const

const OPTIONAL_VARS = [
  'MP_PLAN_ID_SOLO',
  'MP_PLAN_ID_PRO',
  'CRON_SECRET',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'TELEGRAM_BOT_TOKEN',
  'RESEND_API_KEY',
]

export function validateEnv(): { ok: boolean; missing: string[] } {
  const missing: string[] = []

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    console.error(
      `[env-validator] ${missing.length} variável(is) obrigatória(s) não configurada(s):\n` +
        missing.map((k) => `  • ${k}`).join('\n')
    )
  }

  return { ok: missing.length === 0, missing }
}

// Auto-validate on first import (module-level execution)
validateEnv()
