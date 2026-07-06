import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyClientOwnership } from '@/lib/ownership'
import { Queue } from 'bullmq'
import { bullmqConnection } from '@/lib/redis'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'

const cnisQueue = new Queue('cnis-processing', { connection: bullmqConnection })

export async function POST(req: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyClientOwnership(params.clientId, session.user.id)

    const doc = await prisma.cnisDocument.findUnique({
      where: { clientId: params.clientId },
      select: { id: true, r2Key: true, fileName: true, clientId: true }
    })

    if (!doc) return NextResponse.json({ error: 'CNIS não encontrado.' }, { status: 404 })

    // Atualizar status para PENDING, limpar erros e limpar dados extraídos
    const updatedDoc = await prisma.cnisDocument.update({
      where: { clientId: params.clientId },
      data: {
        processingStatus: 'PENDING',
        processingError: null,
        markdownContent: '',
        extractedData: {},
      }
    })

    // Registrar log de atividade de auditoria
    await logAudit({
      userId: session.user.id,
      action: 'cnis.reprocess',
      resource: `Reprocessamento do CNIS iniciado para o cliente ${params.clientId}`,
      req,
      metadata: { clientId: doc.clientId, fileName: doc.fileName },
    })

    // Enfileirar processamento no BullMQ com auto-retry
    await cnisQueue.add(
      'process-cnis',
      {
        cnisDocumentId: updatedDoc.id,
        r2Key: doc.r2Key,
        clientId: doc.clientId,
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

    return NextResponse.json({ success: true, cnisDocument: updatedDoc })
  } catch (err) {
    return handleApiError(err)
  }
}
