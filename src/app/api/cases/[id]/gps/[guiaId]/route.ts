import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; guiaId: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const guia = await prisma.gpsGuide.findFirst({
      where: { id: params.guiaId, caseId: params.id },
    })

    if (!guia) return NextResponse.json({ error: 'Guia não encontrada.' }, { status: 404 })

    await prisma.gpsGuide.delete({ where: { id: params.guiaId } })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
