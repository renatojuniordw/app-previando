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
import { verifyClientOwnership } from '@/lib/ownership'
import { Queue } from 'bullmq'
import { bullmqConnection } from '@/lib/redis'

const cnisQueue = new Queue('cnis-processing', { connection: bullmqConnection })

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
    const clientId = formData.get('clientId') as string | null

    if (!file || !clientId) {
      return NextResponse.json({ error: 'Arquivo e clientId são obrigatórios.' }, { status: 400 })
    }

    // Verificar ownership do cliente (anti-IDOR)
    await verifyClientOwnership(clientId, session.user.id)
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { name: true } })

    const buffer = Buffer.from(await file.arrayBuffer())

    // Validar PDF (MIME, tamanho, magic bytes)
    await validatePDFUpload(buffer, file.name, file.type)

    // Upload para Cloudflare R2
    const r2Key = await uploadPDF(buffer, session.user.id, clientId)

    // Se já existia um CNIS para esse cliente, excluímos o arquivo antigo do R2 para não deixar lixo órfão
    const existingDoc = await prisma.cnisDocument.findUnique({
      where: { clientId },
      select: { r2Key: true },
    })
    if (existingDoc) {
      try {
        await deletePDF(existingDoc.r2Key)
      } catch (err) {
        logger.error(`Failed to delete old CNIS PDF ${existingDoc.r2Key} from R2`, err)
      }

      // Forçar a exclusão dos dados calculados em background para manter a consistência
      // (dados de cálculo continuam por caso — todos os casos deste cliente são afetados)
      try {
        await prisma.$transaction([
          prisma.calculation.deleteMany({ where: { case: { clientId } } }),
          prisma.simulation.deleteMany({ where: { case: { clientId } } }),
          prisma.retroactive.deleteMany({ where: { case: { clientId } } }),
          prisma.opinion.deleteMany({ where: { case: { clientId } } }),
          prisma.checklist.deleteMany({ where: { case: { clientId } } }),
        ])
      } catch (err) {
        logger.error(`Failed to cascade delete old calculated data in background for client ${clientId}`, err)
      }
    }

    // Criar/atualizar registro CNIS no banco (PENDING)
    const cnisDoc = await prisma.cnisDocument.upsert({
      where: { clientId },
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
        clientId,
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
      resource: `CNIS enviado para ${client?.name ?? 'Cliente'}`,
      req,
      metadata: { clientId, fileName: file.name, fileSize: buffer.byteLength },
    })

    // Enfileirar processamento no BullMQ com auto-retry (3 tentativas, exponential backoff)
    await cnisQueue.add(
      'process-cnis',
      {
        cnisDocumentId: cnisDoc.id,
        r2Key,
        clientId,
        userId: session.user.id,
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
