import { Worker } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'
import Redis from 'ioredis'
import { writeAuditDirect } from '../lib/audit'
import type { AuditJobData } from '../lib/audit'
import { Logger } from '../lib/logger'

const logger = new Logger('AuditWorker')

export function createAuditWorker(redis: Redis): Worker {
  const conn = redis as unknown as ConnectionOptions
  const worker = new Worker(
    'audit-log',
    async (job) => {
      const data = job.data as AuditJobData
      await writeAuditDirect(data)
    },
    {
      connection: conn,
      concurrency: 10,
    }
  )

  worker.on('failed', (job, err) => {
    logger.error(`Audit job ${job?.id} failed`, err)
  })

  return worker
}
