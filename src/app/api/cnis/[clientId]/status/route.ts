import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyClientOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyClientOwnership(params.clientId, session.user.id)

    const doc = await prisma.cnisDocument.findUnique({
      where: { clientId: params.clientId },
      select: {
        id: true,
        processingStatus: true,
        processingError: true,
        nit: true,
        totalContributions: true,
        firstContribution: true,
        lastContribution: true,
        updatedAt: true,
      },
    })

    if (!doc) return NextResponse.json({ status: 'NOT_FOUND' })

    return NextResponse.json({
      status: doc.processingStatus,
      error: doc.processingError,
      summary: ['COMPLETED', 'SUMMARY_READY', 'PROCESSING_DETAILS'].includes(doc.processingStatus)
        ? {
            nit: doc.nit,
            totalContribuicoes: doc.totalContributions,
            primeiraContribuicao: doc.firstContribution,
            ultimaContribuicao: doc.lastContribution,
          }
        : null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
