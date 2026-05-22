import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { mpPreApproval } from '@/services/mercadopago'
import { handleApiError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mpSubscriptionId: true },
    })

    if (!user?.mpSubscriptionId) {
      return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
    }

    await mpPreApproval.update({
      id: user.mpSubscriptionId,
      body: { status: 'cancelled' },
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { planStatus: 'CANCELLED' },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
