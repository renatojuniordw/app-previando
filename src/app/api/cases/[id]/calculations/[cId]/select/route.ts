import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; cId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnershipAndActive(params.id, session.user.id)

    const { success: limitOk } = await rateLimit(`select-calc:${session.user.id}`, 20, 3600)
    if (!limitOk) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })

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

    await logAudit({
      userId: session.user.id,
      action: 'calculation.selected',
      resource: `Cálculo (${calc.modality.replace(/_/g, ' ')}) selecionado`,
      req,
      metadata: { caseId: params.id, calculationId: params.cId },
    })

    return NextResponse.json({ success: true, selectedId: params.cId })
  } catch (err) {
    return handleApiError(err)
  }
}
