import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { mpPreApproval, MP_PLAN_IDS, PLAN_PRICES } from '@/services/mercadopago'
import { handleApiError } from '@/lib/api-error'

const schema = z.object({
  plan: z.enum(['SOLO', 'PRO']),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
    }

    const { plan } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })

    if (!user?.email) return NextResponse.json({ error: 'Email não encontrado.' }, { status: 400 })

    const subscription = await mpPreApproval.create({
      body: {
        preapproval_plan_id: MP_PLAN_IDS[plan],
        payer_email: user.email,
        // Vincula a assinatura ao usuário de forma inequívoca — o webhook usa isso
        // como fonte primária de identificação (o email do pagador no checkout do MP
        // pode divergir do email cadastrado, e é um campo que o pagador controla).
        external_reference: session.user.id,
        back_url: 'https://app.previando.com.br/settings/billing?status=success',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: PLAN_PRICES[plan],
          currency_id: 'BRL',
        },
      },
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      initPoint: subscription.init_point,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
