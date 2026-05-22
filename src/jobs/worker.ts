import { loadEnvFile } from 'node:process'
try {
  loadEnvFile('.env')
  console.log('[Worker] Environment variables loaded from .env')
} catch (e) {
  console.error('[Worker] Failed to load .env file natively:', e)
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

    console.log(`[Worker] Processing CNIS: ${cnisDocumentId}`)

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
        const parsed = await pdfParse.default(buffer)
        pdfText = parsed.text
      } catch {
        // Fallback OCR com Tesseract se pdf-parse falhar
        const Tesseract = await import('tesseract.js')
        const { data } = await Tesseract.recognize(buffer, 'por')
        pdfText = data.text
      }

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
          totalContribuicoes: extractedData.totalContribuicoes ?? null,
          primeiraContribuicao: extractedData.primeiraContribuicao
            ? new Date(extractedData.primeiraContribuicao + '-01')
            : null,
          ultimaContribuicao: extractedData.ultimaContribuicao
            ? new Date(extractedData.ultimaContribuicao + '-01')
            : null,
        },
      })

      console.log(`[Worker] CNIS processed successfully: ${cnisDocumentId}`)
    } catch (err) {
      console.error(`[Worker] Failed to process CNIS ${cnisDocumentId}:`, err)

      await prisma.cnisDocument.update({
        where: { id: cnisDocumentId },
        data: {
          processingStatus: 'FAILED',
          processingError: String(err),
        },
      })

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
  console.log(`[Worker] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err)
})

console.log('[Worker] BullMQ worker started — waiting for CNIS jobs...')
