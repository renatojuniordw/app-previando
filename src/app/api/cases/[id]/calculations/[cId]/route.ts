import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; cId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const calc = await prisma.calculation.findFirst({
      where: { id: params.cId, caseId: params.id },
    })
    if (!calc) return NextResponse.json({ error: 'Cálculo não encontrado.' }, { status: 404 })

    await prisma.calculation.delete({ where: { id: params.cId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
