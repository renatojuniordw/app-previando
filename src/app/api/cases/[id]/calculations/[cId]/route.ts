import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
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

    const { success: limitOk } = await rateLimit(`delete-calc:${session.user.id}`, 10, 3600)
    if (!limitOk) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })

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
