import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function GET() {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ])

  const db = checks[0].status === 'fulfilled'
  const redisOk = checks[1].status === 'fulfilled'
  const r2 = !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  )

  const healthy = db && redisOk && r2
  const status = healthy ? 200 : 503

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks: {
        db: db ? 'ok' : 'error',
        redis: redisOk ? 'ok' : 'error',
        r2: r2 ? 'configured' : 'missing_env',
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}
