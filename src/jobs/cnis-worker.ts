import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from '../lib/prisma'
import { downloadPDF } from '../services/r2'
import { parseCnisWithAI } from '../services/cnis-parser'
import { Logger } from '../lib/logger'

const logger = new Logger('CnisWorker')

export function createCnisWorker(redis: Redis): Worker {
  const worker = new Worker(
    'cnis-processing',
    async (job) => {
      const { cnisDocumentId, r2Key, caseId } = job.data

      logger.info(`Processing CNIS: ${cnisDocumentId}`, { cnisDocumentId, r2Key, caseId })

      try {
        await prisma.cnisDocument.update({
          where: { id: cnisDocumentId },
          data: { processingStatus: 'PROCESSING' },
        })
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === 'P2025') {
          logger.warn(`CNIS ${cnisDocumentId} was deleted before processing — skipping job`)
          return
        }
        throw err
      }

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
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === 'P2025') {
          logger.warn(`CNIS ${cnisDocumentId} was deleted during processing — discarding job`)
          return
        }

        logger.error(`Failed to process CNIS ${cnisDocumentId} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? 1})`, err)

        const isFinalAttempt = (job.attemptsMade + 1) >= (job.opts.attempts ?? 1)
        if (isFinalAttempt) {
          await prisma.cnisDocument.update({
            where: { id: cnisDocumentId },
            data: {
              processingStatus: 'FAILED',
              processingError: String(err),
            },
          }).catch(() => { /* já foi deletado, ignora */ })
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

  worker.on('completed', (job) => {
    logger.info(`CNIS job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    logger.error(`CNIS job ${job?.id} failed`, err)
  })

  return worker
}
