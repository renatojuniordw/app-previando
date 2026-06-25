import { loadEnvFile } from 'node:process'
import { Logger } from '../lib/logger'

const logger = new Logger('Worker')

try {
  loadEnvFile('.env')
  logger.info('Environment variables loaded from .env')
} catch (e) {
  logger.error('Failed to load .env file natively', e)
}

import { Worker, Queue } from 'bullmq'
import { prisma } from '../lib/prisma'
import { downloadPDF } from '../services/r2'
import { parseCnisWithAI } from '../services/cnis-parser'
import { writeAuditDirect } from '../lib/audit'
import type { AuditJobData } from '../lib/audit'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:60004', {
  maxRetriesPerRequest: null,
})

// ─── Worker: CNIS processing ───────────────────────────────────────────────

const cnisWorker = new Worker(
  'cnis-processing',
  async (job) => {
    const { cnisDocumentId, r2Key, caseId } = job.data

    logger.info(`Processing CNIS: ${cnisDocumentId}`, { cnisDocumentId, r2Key, caseId })

    await prisma.cnisDocument.update({
      where: { id: cnisDocumentId },
      data: { processingStatus: 'PROCESSING' },
    })

    try {
      const buffer = await downloadPDF(r2Key)

      const pdfParse = await import('pdf-parse')
      let pdfText = ''
      try {
        const parsed = await pdfParse.default(buffer, { max: 0 })
        pdfText = parsed.text
      } catch {
        // Fallback OCR com Tesseract se pdf-parse falhar
        const Tesseract = await import('tesseract.js')
        const { data } = await Tesseract.recognize(buffer, 'por')
        pdfText = data.text
      }

      logger.info(`PDF text length: ${pdfText.length} chars`, { cnisDocumentId })
      logger.debug(`PDF text preview (last 500): ${pdfText.slice(-500)}`, { cnisDocumentId })

      const { markdown, extractedData } = await parseCnisWithAI(pdfText)

      await prisma.cnisDocument.update({
        where: { id: cnisDocumentId },
        data: {
          processingStatus: 'COMPLETED',
          markdownContent: markdown,
          extractedData: extractedData as never,
          nit: extractedData.nit ?? null,
          totalContributions: extractedData.totalContribuicoes ?? null,
          firstContribution: extractedData.primeiraContribuicao
            ? new Date(extractedData.primeiraContribuicao + '-01')
            : null,
          lastContribution: extractedData.ultimaContribuicao
            ? new Date(extractedData.ultimaContribuicao + '-01')
            : null,
        },
      })

      logger.info(`CNIS processed successfully: ${cnisDocumentId}`, { cnisDocumentId })
    } catch (err) {
      logger.error(`Failed to process CNIS ${cnisDocumentId} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? 1})`, err)

      const isFinalAttempt = (job.attemptsMade + 1) >= (job.opts.attempts ?? 1)
      if (isFinalAttempt) {
        await prisma.cnisDocument.update({
          where: { id: cnisDocumentId },
          data: {
            processingStatus: 'FAILED',
            processingError: String(err),
          },
        })
      }

      throw err
    }
  },
  {
    connection: redis,
    concurrency: 2,
    limiter: { max: 5, duration: 60000 },
  }
)

cnisWorker.on('completed', (job) => {
  logger.info(`CNIS job ${job.id} completed`)
})

cnisWorker.on('failed', (job, err) => {
  logger.error(`CNIS job ${job?.id} failed`, err)
})

// ─── Worker: Audit log (async, fire-and-forget) ────────────────────────────

const auditWorker = new Worker(
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

auditWorker.on('failed', (job, err) => {
  logger.error(`Audit job ${job?.id} failed`, err)
})

// ─── Worker: Deadline notifications (daily job) ────────────────────────────

const deadlineQueue = new Queue('deadline-notifications', { connection: redis })

const deadlineWorker = new Worker(
  'deadline-notifications',
  async () => {
    const now = new Date()
    const thresholds = [
      { days: 1, type: 'DEADLINE_1D' as const },
      { days: 3, type: 'DEADLINE_3D' as const },
      { days: 7, type: 'DEADLINE_7D' as const },
    ]

    for (const { days, type } of thresholds) {
      const windowStart = new Date(now)
      windowStart.setDate(windowStart.getDate() + days)
      windowStart.setHours(0, 0, 0, 0)

      const windowEnd = new Date(windowStart)
      windowEnd.setHours(23, 59, 59, 999)

      const cases = await prisma.case.findMany({
        where: {
          deadlineDate: { gte: windowStart, lte: windowEnd },
          status: { notIn: ['FINISHED'] },
        },
        select: {
          id: true,
          userId: true,
          deadlineDate: true,
          benefitType: true,
          client: { select: { name: true } },
        },
      })

      for (const c of cases) {
        const dateStr = c.deadlineDate!.toLocaleDateString('pt-BR')
        const alreadyExists = await prisma.notification.findFirst({
          where: { userId: c.userId, caseId: c.id, type, createdAt: { gte: windowStart } },
        })
        if (alreadyExists) continue

        await prisma.notification.create({
          data: {
            userId: c.userId,
            caseId: c.id,
            type,
            message: `Prazo do caso de ${c.client.name} vence em ${days} dia${days > 1 ? 's' : ''} (${dateStr}).`,
          },
        })
      }
    }

    logger.info('Deadline notification job completed')
  },
  { connection: redis, concurrency: 1 }
)

deadlineWorker.on('failed', (job, err) => {
  logger.error(`Deadline job ${job?.id} failed`, err)
})

// Agenda o job diário para rodar às 08:00 (se não existir)
async function scheduleDeadlineJob() {
  const repeatableJobs = await deadlineQueue.getRepeatableJobs()
  const alreadyScheduled = repeatableJobs.some((j) => j.name === 'daily-deadline-check')
  if (!alreadyScheduled) {
    await deadlineQueue.add('daily-deadline-check', {}, {
      repeat: { pattern: '0 8 * * *' },
      removeOnComplete: true,
    })
    logger.info('Scheduled daily deadline check job at 08:00')
  }
}

scheduleDeadlineJob().catch((err) => logger.error('Failed to schedule deadline job', err))

logger.info('BullMQ workers started — CNIS processing + audit log + deadline notifications')
