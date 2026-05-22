import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/logger'

const logger = new Logger('WebhookMercadoPago')

function verifyWebhookSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return false

  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''
  const dataId = req.nextUrl.searchParams.get('data.id') ?? ''

  // Formato Mercado Pago: id:dataId;request-id:requestId;ts:timestamp
  const ts = xSignature.split(';').find((p) => p.startsWith('ts='))?.replace('ts=', '') ?? ''
  const v1 = xSignature.split(';').find((p) => p.startsWith('v1='))?.replace('v1=', '') ?? ''

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  return expected === v1
}

function mapMpStatus(mpStatus: string): string {
  const map: Record<string, string> = {
    authorized: 'ACTIVE',
    paused: 'PAST_DUE',
    cancelled: 'CANCELLED',
    pending: 'ACTIVE',
    suspended: 'SUSPENDED',
  }
  return map[mpStatus] ?? 'ACTIVE'
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Verificar assinatura criptográfica HMAC-SHA256
  if (!verifyWebhookSignature(req, rawBody)) {
    logger.warn('Assinatura inválida')
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const type = payload.type as string
  const data = payload.data as { id?: string } | undefined

  if (!data?.id) return NextResponse.json({ received: true })

  try {
    if (type === 'subscription_preapproval') {
      const subId = String(data.id)

      // Buscar dados da assinatura no MP
      const mpSub = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
      }).then((r) => r.json())

      if (!mpSub?.payer_email) return NextResponse.json({ received: true })

      const user = await prisma.user.findUnique({
        where: { email: mpSub.payer_email },
        select: { id: true, plan: true },
      })

      if (!user) return NextResponse.json({ received: true })

      const planStatus = mapMpStatus(mpSub.status)
      let plan = user.plan

      if (planStatus === 'ACTIVE' && mpSub.preapproval_plan_id) {
        if (mpSub.preapproval_plan_id === process.env.MP_PLAN_ID_SOLO) plan = 'SOLO'
        else if (mpSub.preapproval_plan_id === process.env.MP_PLAN_ID_PRO) plan = 'PRO'
      } else if (planStatus === 'CANCELLED') {
        plan = 'FREE'
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: plan as never,
          planStatus: planStatus as never,
          mpSubscriptionId: subId,
          mpSubscriptionStatus: mpSub.status,
        },
      })
    }

    if (type === 'payment') {
      const paymentId = String(data.id)

      const mpPayment = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
      }).then((r) => r.json())

      if (!mpPayment?.payer?.email) return NextResponse.json({ received: true })

      const user = await prisma.user.findUnique({
        where: { email: mpPayment.payer.email },
        select: { id: true, plan: true },
      })

      if (!user) return NextResponse.json({ received: true })

      await prisma.payment.upsert({
        where: { mpPaymentId: paymentId },
        update: {
          status: mpPayment.status?.toUpperCase() ?? 'PENDING',
          paidAt: mpPayment.date_approved ? new Date(mpPayment.date_approved) : null,
        },
        create: {
          userId: user.id,
          mpPaymentId: paymentId,
          mpSubscriptionId: mpPayment.preapproval_id ?? null,
          plan: user.plan,
          amount: mpPayment.transaction_amount ?? 0,
          currency: mpPayment.currency_id ?? 'BRL',
          status: mpPayment.status?.toUpperCase() ?? 'PENDING',
          paidAt: mpPayment.date_approved ? new Date(mpPayment.date_approved) : null,
          periodStart: mpPayment.date_created ? new Date(mpPayment.date_created) : null,
        },
      })
    }
  } catch (err) {
    logger.error('Error processing event', err)
  }

  return NextResponse.json({ received: true })
}
