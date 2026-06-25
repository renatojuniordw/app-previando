import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from '../lib/prisma'
import { downloadPDF } from '../services/r2'
import { parseCnisWithAI } from '../services/cnis-parser'
import { Logger } from '../lib/logger'

const logger = new Logger('CnisWorker')

export function createCnisWorker(redis: Redis): Worker {
  return new Worker(
    'cnis-processing',
    async (job) => {
      const { cnisDocumentId, r2Key, caseId } = job.data

      logger.info(`Processing CNIS: ${cnisDocumentId}`, { cnisDocumentId, r2Key, caseId })

      // ─── Validar documento ──────────────────────────────────────────
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
        // ─── Extrair texto do PDF ─────────────────────────────────────
        const buffer = await downloadPDF(r2Key)

        const pdfParse = await import('pdf-parse')
        let pdfText = ''
        try {
          const parsed = await pdfParse.default(buffer, { max: 0 })
          pdfText = parsed.text
        } catch {
          const Tesseract = await import('tesseract.js')
          const { data } = await Tesseract.recognize(buffer, 'por')
          pdfText = data.text
        }

        logger.info(`PDF text length: ${pdfText.length} chars`, { cnisDocumentId })

        // ─── Extração completa (única passagem) ──────────────────────
        const { markdown, extractedData, tokens } = await parseCnisWithAI(pdfText)

        await prisma.cnisDocument.update({
          where: { id: cnisDocumentId },
          data: {
            processingStatus: 'COMPLETED',
            markdownContent: markdown,
            extractedData: extractedData as never,
            nit: extractedData.nit ?? null,
            totalContributions: extractedData.totalContribuicoes ?? null,
            firstContribution: extractedData.primeiraContribuicao ? toDateTime(extractedData.primeiraContribuicao) : null,
            lastContribution: extractedData.ultimaContribuicao ? toDateTime(extractedData.ultimaContribuicao) : null,
          },
        })

        logger.info(`CNIS processado (${tokens} tokens): ${cnisDocumentId}`)
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))

        await prisma.cnisDocument.update({
          where: { id: cnisDocumentId },
          data: {
            processingStatus: 'FAILED',
            processingError: error.message,
          },
        }).catch(() => {
          // Se falhar ao atualizar status, tenta pelo menos marcar como FAILED
          logger.error(`Failed to update CNIS status to FAILED: ${cnisDocumentId}`, err)
        })

        logger.error(`CNIS processing failed: ${cnisDocumentId}`, err)
        throw err
      }
    },
    {
      connection: redis,
      concurrency: 2,
      limiter: { max: 5, duration: 60_000 },
      // attempt: 2, // Note: BullMQ v4 uses 'attempts' instead
    }
  )
}


function toDateTime(competencia: string): Date | null {
  // Converte "YYYY-MM" para Date
  const match = competencia.match(/(\d{4})-(\d{2})/)
  if (!match) return null
  return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1)
}
