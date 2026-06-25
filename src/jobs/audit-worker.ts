import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { writeAuditDirect } from '../lib/audit'
import type { AuditJobData } from '../lib/audit'
import { Logger } from '../lib/logger'

const logger = new Logger('AuditWorker')

export function createAuditWorker(redis: Redis): Worker {
  const worker = new Worker(
    'audit-log',
    async (job) => {
      const data = job.data as AuditJobData
      await writeAuditDirect(data)
    },
    {
      connection: redis,
      concurrency: 10,
    }
  )

  worker.on('failed', (job, err) => {
    logger.error(`Audit job ${job?.id} failed`, err)
  })

  return worker
}
