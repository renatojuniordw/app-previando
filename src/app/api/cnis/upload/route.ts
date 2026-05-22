import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
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
      select: { id: true },
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
        console.error(`[Upload] Failed to delete old CNIS PDF ${existingDoc.r2Key} from R2:`, err)
      }

      // Forçar a exclusão dos dados calculados em background para manter a consistência
      try {
        await prisma.$transaction([
          prisma.calculation.deleteMany({ where: { caseId } }),
          prisma.simulation.deleteMany({ where: { caseId } }),
          prisma.retroativo.deleteMany({ where: { caseId } }),
          prisma.opinion.deleteMany({ where: { caseId } }),
          prisma.checklist.deleteMany({ where: { caseId } }),
        ])
      } catch (err) {
        console.error(`[Upload] Failed to cascade delete old calculated data in background for case ${caseId}:`, err)
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

    // Enfileirar processamento no BullMQ
    await cnisQueue.add('process-cnis', {
      cnisDocumentId: cnisDoc.id,
      r2Key,
      caseId,
    })

    return NextResponse.json({
      success: true,
      cnisDocumentId: cnisDoc.id,
      status: 'PENDING',
    }, { status: 202 })
  } catch (err) {
    return handleApiError(err)
  }
}
