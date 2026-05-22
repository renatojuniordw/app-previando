import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; sId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const sim = await prisma.simulation.findFirst({
      where: { id: params.sId, caseId: params.id },
    })
    if (!sim) return NextResponse.json({ error: 'Simulação não encontrada.' }, { status: 404 })

    await prisma.simulation.delete({ where: { id: params.sId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
