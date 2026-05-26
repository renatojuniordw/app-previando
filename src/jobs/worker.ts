import { loadEnvFile } from 'node:process'
import { Logger } from '../lib/logger'

const logger = new Logger('Worker')

try {
  loadEnvFile('.env')
  logger.info('Environment variables loaded from .env')
} catch (e) {
  logger.error('Failed to load .env file natively', e)
}

import { Worker } from 'bullmq'
import { prisma } from '../lib/prisma'
import { downloadPDF } from '../services/r2'
import { parseCnisWithAI } from '../services/cnis-parser'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:60004', {
  maxRetriesPerRequest: null,
})

const worker = new Worker(
  'cnis-processing',
  async (job) => {
    const { cnisDocumentId, r2Key, caseId } = job.data

    logger.info(`Processing CNIS: ${cnisDocumentId}`, { cnisDocumentId, r2Key, caseId })

    // Marcar como PROCESSING
    await prisma.cnisDocument.update({
      where: { id: cnisDocumentId },
      data: { processingStatus: 'PROCESSING' },
    })

    try {
      // 1. Baixar PDF do R2
      const buffer = await downloadPDF(r2Key)

      // 2. Extrair texto do PDF
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

      // 3. Parsear com IA
      const { markdown, extractedData } = await parseCnisWithAI(pdfText)

      // 4. Salvar no banco
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

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, err)
})

logger.info('BullMQ worker started — waiting for CNIS jobs...')
