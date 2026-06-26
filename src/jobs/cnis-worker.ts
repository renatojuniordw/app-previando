import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from '../lib/prisma'
import { downloadPDF } from '../services/r2'
import { parseCnisWithAI, validateCnisProgrammaticResult, parseCnisProgrammatically } from '../services/cnis-parser'
import { Logger } from '../lib/logger'
import { writeAuditDirect } from '../lib/audit'

const logger = new Logger('CnisWorker')

export function createCnisWorker(redis: Redis): Worker {
  return new Worker(
    'cnis-processing',
    async (job) => {
      const { cnisDocumentId, r2Key, caseId } = job.data

      logger.info(`Processing CNIS: ${cnisDocumentId}`, { cnisDocumentId, r2Key, caseId })

      // ─── Validar documento e buscar dados do caso ───────────────────
      let caseRecord: { userId: string } | null = null
      try {
        caseRecord = await prisma.case.findUnique({
          where: { id: caseId },
          select: { userId: true },
        })

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
          // pdf-parse falhou — tenta OCR
        }

        if (pdfText.trim().length < 100) {
          logger.info('Texto extraído muito curto — usando Tesseract OCR', { cnisDocumentId })
          const Tesseract = await import('tesseract.js')
          const { data } = await Tesseract.recognize(buffer, 'por')
          pdfText = data.text
        }

        if (pdfText.trim().length < 100) {
          throw new Error('Não foi possível extrair texto do documento PDF.')
        }

        logger.info(`PDF text length: ${pdfText.length} chars`, { cnisDocumentId })

        // ─── Extração Híbrida ────────────────────────────────────────
        let markdown = ''
        let extractedData: any = null
        let tokens = 0
        let isProgrammatic = false

        logger.info(`Iniciando extração do CNIS: ${cnisDocumentId}...`)
        
        try {
          const progResult = parseCnisProgrammatically(pdfText)
          if (progResult) {
            logger.info(`Parser programático obteve sucesso para: ${progResult.extractedData.nome}. Iniciando validação...`)

            const validation = await validateCnisProgrammaticResult(pdfText, {
              nit: progResult.extractedData.nit ?? null,
              nome: progResult.extractedData.nome ?? null,
              primeiraContribuicao: progResult.extractedData.primeiraContribuicao ?? null,
              ultimaContribuicao: progResult.extractedData.ultimaContribuicao ?? null,
            })

            if (validation.valid) {
              markdown = progResult.markdown
              extractedData = progResult.extractedData
              isProgrammatic = true
              logger.info(`Validação confirmada — usando resultado programático`)
            } else {
              logger.warn(`Validação reprovada (${validation.reason}). Escalando para AI parser completo...`)
            }
          }
        } catch (progErr) {
          logger.warn(`Erro no parser programático (ignorando e seguindo para IA):`, progErr)
        }

        // Fallback: programático falhou, não retornou dados, ou validação reprovou
        if (!extractedData) {
          logger.info(`Iniciando AI parser completo...`)
          const aiResult = await parseCnisWithAI(pdfText)
          markdown = aiResult.markdown
          extractedData = aiResult.extractedData
          tokens = aiResult.tokens
        }

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

        // ─── Criar Notificação de Sucesso ────────────────────────────
        if (caseRecord?.userId) {
          await prisma.notification.create({
            data: {
              userId: caseRecord.userId,
              type: 'CNIS_PROCESSED',
              caseId,
              message: `O CNIS de ${extractedData.nome || 'Segurado'} foi processado com sucesso!${isProgrammatic ? ' (Instantâneo)' : ''}`,
            },
          }).catch((err) => {
            logger.error(`Failed to create success notification for case ${caseId}`, err)
          })

          await writeAuditDirect({
            userId: caseRecord.userId,
            action: 'cnis.processed',
            resource: `CNIS processado para ${extractedData.nome || 'Segurado'}`,
            ipAddress: null,
            userAgent: null,
            metadata: { caseId, cnisDocumentId, isProgrammatic },
          }).catch((err) => {
            logger.error(`Failed to write success audit log for case ${caseId}`, err)
          })
        }

        logger.info(`CNIS processado com sucesso (${isProgrammatic ? 'Programático' : `${tokens} tokens via IA`}): ${cnisDocumentId}`)
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

        // ─── Criar Notificação de Falha ──────────────────────────────
        if (caseRecord?.userId) {
          await prisma.notification.create({
            data: {
              userId: caseRecord.userId,
              type: 'CNIS_FAILED',
              caseId,
              message: `Falha ao processar o CNIS do caso: ${error.message}`,
            },
          }).catch((err) => {
            logger.error(`Failed to create fail notification for case ${caseId}`, err)
          })

          await writeAuditDirect({
            userId: caseRecord.userId,
            action: 'cnis.failed',
            resource: `Falha no processamento CNIS`,
            ipAddress: null,
            userAgent: null,
            metadata: { caseId, cnisDocumentId, error: error.message },
          }).catch((err) => {
            logger.error(`Failed to write failure audit log for case ${caseId}`, err)
          })
        }

        logger.error(`CNIS processing failed: ${cnisDocumentId}`, err)
        throw err
      }
    },
    {
      connection: redis as any,
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
