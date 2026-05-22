import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.caseId, session.user.id)

    const doc = await prisma.cnisDocument.findUnique({
      where: { caseId: params.caseId },
      select: {
        id: true,
        processingStatus: true,
        processingError: true,
        nit: true,
        totalContribuicoes: true,
        primeiraContribuicao: true,
        ultimaContribuicao: true,
        updatedAt: true,
      },
    })

    if (!doc) return NextResponse.json({ status: 'NOT_FOUND' })

    return NextResponse.json({
      status: doc.processingStatus,
      error: doc.processingError,
      summary: doc.processingStatus === 'COMPLETED'
        ? {
            nit: doc.nit,
            totalContribuicoes: doc.totalContribuicoes,
            primeiraContribuicao: doc.primeiraContribuicao,
            ultimaContribuicao: doc.ultimaContribuicao,
          }
        : null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
