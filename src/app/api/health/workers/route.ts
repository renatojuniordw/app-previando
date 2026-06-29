import { NextResponse } from 'next/server'
import { redis, bullmqConnection } from '@/lib/redis'
import { Queue } from 'bullmq'

const QUEUES = ['cnis-processing', 'audit-log', 'deadline-notifications', 'email-notifications']

async function getQueueMetrics(name: string) {
  try {
    const queue = new Queue(name, { connection: bullmqConnection })
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ])
    await queue.close()
    return { name, waiting, active, completed, failed, delayed, status: 'ok' as const }
  } catch {
    return { name, status: 'error' as const }
  }
}

export async function GET() {
  try {
    await redis.ping()
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        queues: QUEUES.map((name) => ({ name, status: 'unknown' as const })),
        error: 'Redis indisponivel',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }

  const results = await Promise.allSettled(QUEUES.map(getQueueMetrics))
  const queues = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'error' as const }
  )

  const allOk = queues.every((q) => q.status === 'ok')

  return NextResponse.json({
    status: allOk ? 'ok' : 'degraded',
    queues,
    timestamp: new Date().toISOString(),
  })
}
