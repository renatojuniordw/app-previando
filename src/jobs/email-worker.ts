/**
 * Email Worker - Previando
 *
 * Processa a fila de emails (`email-notifications`) enviando emails via nodemailer.
 *
 * A factory function `createEmailWorker()` deve ser chamada pelo `worker.ts`.
 * Não exportar uma instância diretamente para evitar workers duplicados.
 */

import { Worker } from 'bullmq'
import nodemailer from 'nodemailer'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.EMAIL_FROM ?? 'Previando <noreply@previando.com.br>'

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
        await transporter.sendMail({
          from: FROM,
          to,
          subject,
          html,
        })

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
      connection: redis,
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
