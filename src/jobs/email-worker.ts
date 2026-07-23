/**
 * Email Worker - Previando
 *
 * Processa a fila de emails (`email-notifications`) enviando emails via Resend.
 *
 * A factory function `createEmailWorker()` deve ser chamada pelo `worker.ts`.
 * Não exportar uma instância diretamente para evitar workers duplicados.
 */

import { Worker } from 'bullmq'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { bullmqConnection } from '@/lib/redis'
import { Logger } from '@/lib/logger'
const logger = new Logger('email-worker')

export function createEmailWorker(): Worker {
  const worker = new Worker(
    'email-notifications',
    async (job) => {
      const { to, subject, html } = job.data

      logger.info('Processing email notification', {
        jobId: job.id,
        to,
        subject,
        attempt: job.attemptsMade,
      })

      try {
        const { error } = await resend.emails.send({
          from: EMAIL_FROM,
          to,
          subject,
          html,
        })

        if (error) {
          throw new Error(error.message)
        }

        logger.info('Email sent successfully', { jobId: job.id, to, subject })
        return { success: true, to, subject }
      } catch (error) {
        logger.error('Failed to send email', {
          jobId: job.id,
          to,
          subject,
          error,
        })
        throw error // BullMQ retry
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 3,
      maxStalledCount: 2,
      lockDuration: 30000,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  )

  worker.on('completed', (job) => {
    logger.info('Email job completed', { jobId: job.id })
  })

  worker.on('failed', (job, error) => {
    logger.error('Email job failed permanently', {
      jobId: job?.id,
      error: error.message,
      attempts: job?.attemptsMade,
    })
  })

  return worker
}
