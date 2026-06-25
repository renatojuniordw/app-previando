import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Logger } from '@/lib/logger'
import { logAudit } from '@/lib/audit'

const logger = new Logger('CNISUpload')
import { prisma } from '@/lib/prisma'
import { uploadPDF, deletePDF } from '@/services/r2'
import { validatePDFUpload } from '@/lib/upload-validator'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'

const cnisQueue = new Queue('cnis-processing', { connection: redis })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    // Rate limit: 10 uploads/hora por usuário
    const limit = await rateLimit(`cnis-upload:${session.user.id}`, 10, 3600)
    if (!limit.success) {
      return NextResponse.json({ error: 'Limite de uploads atingido. Tente em 1 hora.' }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const caseId = formData.get('caseId') as string | null

    if (!file || !caseId) {
      return NextResponse.json({ error: 'Arquivo e caseId são obrigatórios.' }, { status: 400 })
    }

    // Verificar ownership do caso
    const caso = await prisma.case.findFirst({
      where: { id: caseId, userId: session.user.id },
      select: { id: true, client: { select: { name: true } } },
    })
    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })

    const buffer = Buffer.from(await file.arrayBuffer())

    // Validar PDF (MIME, tamanho, magic bytes)
    await validatePDFUpload(buffer, file.name, file.type)

    // Upload para Cloudflare R2
    const r2Key = await uploadPDF(buffer, session.user.id, caseId)

    // Se já existia um CNIS para esse caso, excluímos o arquivo antigo do R2 para não deixar lixo órfão
    const existingDoc = await prisma.cnisDocument.findUnique({
      where: { caseId },
      select: { r2Key: true },
    })
    if (existingDoc) {
      try {
        await deletePDF(existingDoc.r2Key)
      } catch (err) {
        logger.error(`Failed to delete old CNIS PDF ${existingDoc.r2Key} from R2`, err)
      }

      // Forçar a exclusão dos dados calculados em background para manter a consistência
      try {
        await prisma.$transaction([
          prisma.calculation.deleteMany({ where: { caseId } }),
          prisma.simulation.deleteMany({ where: { caseId } }),
          prisma.retroactive.deleteMany({ where: { caseId } }),
          prisma.opinion.deleteMany({ where: { caseId } }),
          prisma.checklist.deleteMany({ where: { caseId } }),
        ])
      } catch (err) {
        logger.error(`Failed to cascade delete old calculated data in background for case ${caseId}`, err)
      }
    }

    // Criar/atualizar registro CNIS no banco (PENDING)
    const cnisDoc = await prisma.cnisDocument.upsert({
      where: { caseId },
      update: {
        r2Key,
        fileName: file.name,
        fileSizeBytes: buffer.byteLength,
        processingStatus: 'PENDING',
        processingError: null,
        markdownContent: '',
        extractedData: {},
      },
      create: {
        caseId,
        r2Key,
        fileName: file.name,
        fileSizeBytes: buffer.byteLength,
        processingStatus: 'PENDING',
        markdownContent: '',
        extractedData: {},
      },
    })

    // Registrar log de atividade
    await logAudit({
      userId: session.user.id,
      action: 'cnis.upload',
      resource: `CNIS enviado para ${caso.client?.name ?? 'Cliente'}`,
      req,
      metadata: { caseId, fileName: file.name, fileSize: buffer.byteLength },
    })

    // Enfileirar processamento no BullMQ com auto-retry (3 tentativas, exponential backoff)
    await cnisQueue.add(
      'process-cnis',
      {
        cnisDocumentId: cnisDoc.id,
        r2Key,
        caseId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    )

    return NextResponse.json({
      success: true,
      cnisDocumentId: cnisDoc.id,
      status: 'PENDING',
    }, { status: 202 })
  } catch (err) {
    return handleApiError(err)
  }
}
