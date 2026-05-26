import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { getSignedDownloadUrl, deletePDF } from '@/services/r2'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.caseId, session.user.id)

    const doc = await prisma.cnisDocument.findUnique({
      where: { caseId: params.caseId },
    })

    if (!doc) return NextResponse.json({ cnisDocument: null })

    let downloadUrl: string | null = null
    if (doc.processingStatus === 'COMPLETED') {
      downloadUrl = await getSignedDownloadUrl(doc.r2Key)
    }

    return NextResponse.json({ cnisDocument: { ...doc, downloadUrl } })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.caseId, session.user.id)

    const doc = await prisma.cnisDocument.findUnique({
      where: { caseId: params.caseId },
    })

    if (!doc) return NextResponse.json({ error: 'CNIS não encontrado.' }, { status: 404 })

    await deletePDF(doc.r2Key)

    // Executar em cascata a exclusão de todos os dados do caso que dependem deste CNIS
    await prisma.$transaction([
      prisma.calculation.deleteMany({ where: { caseId: params.caseId } }),
      prisma.simulation.deleteMany({ where: { caseId: params.caseId } }),
      prisma.retroactive.deleteMany({ where: { caseId: params.caseId } }),
      prisma.opinion.deleteMany({ where: { caseId: params.caseId } }),
      prisma.checklist.deleteMany({ where: { caseId: params.caseId } }),
      prisma.cnisDocument.delete({ where: { caseId: params.caseId } }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
