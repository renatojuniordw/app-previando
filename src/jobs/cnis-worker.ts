import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from '../lib/prisma'
import { downloadPDF } from '../services/r2'
import { parseCnisSummary, parseCnisSalarios } from '../services/cnis-parser'
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

        // ─── Passagem 1: Resumo (rápido) ─────────────────────────────
        const { summary, tokens: summaryTokens } = await parseCnisSummary(pdfText)

        // Gerar markdown do resumo
        const markdown = generateMarkdownFromSummary(summary)

        // Salvar resumo — UI já pode mostrar
        await prisma.cnisDocument.update({
          where: { id: cnisDocumentId },
          data: {
            processingStatus: 'SUMMARY_READY',
            markdownContent: markdown,
            extractedData: summary as never,
            nit: summary.nit ?? null,
            totalContributions: summary.totalContribuicoes ?? null,
            firstContribution: summary.primeiraContribuicao ? toDateTime(summary.primeiraContribuicao) : null,
            lastContribution: summary.ultimaContribuicao ? toDateTime(summary.ultimaContribuicao) : null,
          },
        })

        logger.info(`Resumo salvo (${summaryTokens} tokens): ${cnisDocumentId}`)

        // ─── Passagem 2: Salários detalhados (background) ────────────
        await prisma.cnisDocument.update({
          where: { id: cnisDocumentId },
          data: { processingStatus: 'PROCESSING_DETAILS' },
        })

        const { salarios, totalTokens: salariosTokens } = await parseCnisSalarios(pdfText)

        // Merge resumo + salários
        const allSalarios = salarios[0]?.salarios ?? []
        const periodos = summary.periodos?.map(p => ({
          ...p,
          salarios: allSalarios,
        })) ?? []

        const extractedData = {
          ...summary,
          periodos,
        }

        // Salvar dados completos
        await prisma.cnisDocument.update({
          where: { id: cnisDocumentId },
          data: {
            processingStatus: 'COMPLETED',
            extractedData: extractedData as never,
          },
        })

        logger.info(`CNIS completo (${summaryTokens + salariosTokens} tokens): ${cnisDocumentId}`)
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

function generateMarkdownFromSummary(summary: {
  nome?: string
  nit?: string
  dataNascimento?: string
  primeiraContribuicao?: string
  ultimaContribuicao?: string
  totalContribuicoes?: number
  periodos?: Array<{
    empregador: string
    inicio: string
    fim: string | null
    resumoSalarios?: {
      media: number
      minimo: number
      maximo: number
      totalCompetencias: number
    }
  }>
}): string {
  let md = `# CNIS - ${summary.nome ?? 'Segurado'}\n\n`
  md += `- **NIT**: ${summary.nit ?? 'N/A'}\n`
  md += `- **Nascimento**: ${summary.dataNascimento ?? 'N/A'}\n`
  md += `- **Primeira contribuição**: ${summary.primeiraContribuicao ?? 'N/A'}\n`
  md += `- **Última contribuição**: ${summary.ultimaContribuicao ?? 'N/A'}\n`
  md += `- **Total de vínculos**: ${summary.totalContribuicoes ?? 'N/A'}\n\n`

  if (summary.periodos?.length) {
    md += '## Períodos\n\n'
    for (const p of summary.periodos) {
      const resumo = p.resumoSalarios
      const salarioInfo = resumo
        ? ` R$ ${resumo.media?.toFixed(2) ?? 'N/A'}/mês (${resumo.totalCompetencias} competências)`
        : ''
      md += `- **${p.empregador}**: ${p.inicio} → ${p.fim ?? 'Ativo'}${salarioInfo}\n`
    }
  }

  return md
}

function toDateTime(competencia: string): Date | null {
  // Converte "YYYY-MM" para Date
  const match = competencia.match(/(\d{4})-(\d{2})/)
  if (!match) return null
  return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1)
}
