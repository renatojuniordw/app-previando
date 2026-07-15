import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

export async function PATCH(_req: NextRequest, { params }: { params: { id: string; docId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const doc = await prisma.document.findFirst({
      where: { id: params.docId, caseId: params.id },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })
    }

    const updated = await prisma.document.update({
      where: { id: params.docId },
      data: { shared: !doc.shared },
      select: { id: true, shared: true, fileName: true },
    })

    return NextResponse.json({ document: updated })
  } catch (err) {
    return handleApiError(err)
  }
}
