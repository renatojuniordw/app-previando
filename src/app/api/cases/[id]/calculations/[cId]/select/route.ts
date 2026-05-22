import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

export async function PATCH(
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

    // Desselecionar todos e selecionar o novo
    await prisma.$transaction([
      prisma.calculation.updateMany({
        where: { caseId: params.id },
        data: { isSelected: false },
      }),
      prisma.calculation.update({
        where: { id: params.cId },
        data: { isSelected: true },
      }),
    ])

    return NextResponse.json({ success: true, selectedId: params.cId })
  } catch (err) {
    return handleApiError(err)
  }
}
