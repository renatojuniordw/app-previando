import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { invalidatePlanLimitCache, reconcileClientActivation } from '@/lib/plan-guard'
import { Logger } from '@/lib/logger'
import type { PaymentStatus, Prisma } from '@prisma/client'

const webhookSchema = z.object({
  type: z.string().min(1),
  data: z.object({
    id: z.string().optional(),
  }).optional(),
})

const logger = new Logger('WebhookMercadoPago')

async function acquireLock(key: string, ttlSeconds = 30): Promise<boolean> {
  try {
    const result = await redis.set(`lock:${key}`, '1', 'EX', ttlSeconds, 'NX')
    return result === 'OK'
  } catch {
    return true // Redis indisponível — deixa processar sem lock
  }
}

async function releaseLock(key: string): Promise<void> {
  try {
    await redis.del(`lock:${key}`)
  } catch {
    // Não crítico — TTL garante liberação automática
  }
}

function verifyWebhookSignature(req: NextRequest, _rawBody: string): boolean {
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

  try {
    const expectedBuf = Buffer.from(expected, 'utf-8')
    const actualBuf = Buffer.from(v1, 'utf-8')
    return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf)
  } catch {
    return false
  }
}

function mapMpSubscriptionStatus(mpStatus: string): string {
  const map: Record<string, string> = {
    authorized: 'ACTIVE',
    paused: 'PAST_DUE',
    cancelled: 'CANCELLED',
    pending: 'ACTIVE',
    suspended: 'SUSPENDED',
  }
  return map[mpStatus] ?? 'ACTIVE'
}

function mapMpPaymentStatus(mpStatus: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    pending: 'PENDING',
    approved: 'APPROVED',
    authorized: 'APPROVED',
    in_process: 'PENDING',
    in_mediation: 'PENDING',
    rejected: 'REJECTED',
    cancelled: 'CANCELLED',
    refunded: 'REFUNDED',
    charged_back: 'REFUNDED',
  }
  return map[mpStatus] ?? 'PENDING'
}

/**
 * Resolve o usuário Previando a partir do payload do Mercado Pago.
 * Prioriza `external_reference` (userId, setado na criação da assinatura em
 * /api/billing/subscribe) — o email do pagador no checkout do MP é um campo
 * que o próprio pagador controla e pode divergir do email cadastrado.
 * Mantém o fallback por email para assinaturas criadas antes desta mudança.
 */
async function resolveUser(
  externalReference: string | undefined,
  payerEmail: string | undefined
): Promise<{ id: string; plan: string } | null> {
  if (externalReference) {
    const user = await prisma.user.findUnique({
      where: { id: externalReference },
      select: { id: true, plan: true },
    })
    if (user) return user
  }
  if (payerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: payerEmail },
      select: { id: true, plan: true },
    })
    if (user) return user
  }
  return null
}

async function recordWebhookEvent(
  eventType: string,
  externalId: string | undefined,
  payload: unknown
): Promise<string> {
  const event = await prisma.webhookEvent.create({
    data: {
      provider: 'mercadopago',
      eventType,
      externalId: externalId ?? null,
      payload: payload as Prisma.InputJsonValue,
    },
    select: { id: true },
  })
  return event.id
}

async function markWebhookEvent(eventId: string, error?: string): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: { processedAt: new Date(), error: error ?? null },
  }).catch(() => {
    // Não crítico — o evento já foi persistido, só o marcador de status falhou
  })
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

  const parsedPayload = webhookSchema.safeParse(payload)
  if (!parsedPayload.success) {
    logger.warn('Payload com estrutura inválida', parsedPayload.error.flatten())
    return NextResponse.json({ received: true })
  }

  const type = parsedPayload.data.type
  const data = parsedPayload.data.data ?? { id: undefined }

  // Persiste o evento bruto antes de processar — permite reprocessamento manual
  // se algo falhar depois deste ponto (ex: API do MP fora do ar).
  const eventId = await recordWebhookEvent(type, data.id, payload).catch((err) => {
    logger.error('Falha ao persistir webhook_event (seguindo sem auditoria)', err)
    return null
  })

  try {
    if (type === 'subscription_preapproval') {
      const subId = String(data.id)

      const locked = await acquireLock(`sub:${subId}`)
      if (!locked) {
        logger.warn(`Evento duplicado ignorado para subscription ${subId}`)
        if (eventId) await markWebhookEvent(eventId, 'duplicado (lock ativo)')
        return NextResponse.json({ received: true })
      }

      try {
        const mpSub = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
          headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
        }).then((r) => r.json())

        if (!mpSub?.payer_email && !mpSub?.external_reference) {
          if (eventId) await markWebhookEvent(eventId, 'sem payer_email/external_reference')
          return NextResponse.json({ received: true })
        }

        const planStatus = mapMpSubscriptionStatus(mpSub.status)

        const user = await resolveUser(mpSub.external_reference, mpSub.payer_email)
        if (!user) {
          logger.warn(`Usuário não encontrado para subscription ${subId}`)
          if (eventId) await markWebhookEvent(eventId, 'usuário não encontrado')
          return NextResponse.json({ received: true })
        }

        let newPlan = user.plan
        await prisma.$transaction(async (tx) => {
          let plan = user.plan
          if (planStatus === 'ACTIVE' && mpSub.preapproval_plan_id) {
            if (mpSub.preapproval_plan_id === process.env.MP_PLAN_ID_SOLO) plan = 'SOLO'
            else if (mpSub.preapproval_plan_id === process.env.MP_PLAN_ID_PRO) plan = 'PRO'
          } else if (planStatus === 'CANCELLED') {
            plan = 'FREE'
          }

          await tx.user.update({
            where: { id: user.id },
            data: {
              plan: plan as never,
              planStatus: planStatus as never,
              mpSubscriptionId: subId,
              mpSubscriptionStatus: mpSub.status,
            },
          })

          await invalidatePlanLimitCache(plan)
          newPlan = plan
        })

        if (newPlan !== user.plan) {
          await reconcileClientActivation(user.id, newPlan)
        }

        if (eventId) await markWebhookEvent(eventId)
      } finally {
        await releaseLock(`sub:${subId}`)
      }
    }

    if (type === 'payment') {
      const paymentId = String(data.id)

      const mpPayment = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
      }).then((r) => r.json())

      if (!mpPayment?.payer?.email && !mpPayment?.external_reference) {
        if (eventId) await markWebhookEvent(eventId, 'sem payer/external_reference')
        return NextResponse.json({ received: true })
      }

      // Pagamentos avulsos não carregam external_reference direto sempre;
      // se a assinatura já foi vinculada antes, localiza o usuário por ela.
      let user = await resolveUser(mpPayment.external_reference, mpPayment.payer?.email)
      if (!user && mpPayment.preapproval_id) {
        user = await prisma.user.findFirst({
          where: { mpSubscriptionId: mpPayment.preapproval_id },
          select: { id: true, plan: true },
        })
      }

      if (!user) {
        logger.warn(`Usuário não encontrado para payment ${paymentId}`)
        if (eventId) await markWebhookEvent(eventId, 'usuário não encontrado')
        return NextResponse.json({ received: true })
      }

      const paymentStatus = mapMpPaymentStatus(mpPayment.status ?? '')
      await prisma.payment.upsert({
        where: { mpPaymentId: paymentId },
        update: {
          status: paymentStatus,
          paidAt: mpPayment.date_approved ? new Date(mpPayment.date_approved) : null,
        },
        create: {
          userId: user.id,
          mpPaymentId: paymentId,
          mpSubscriptionId: mpPayment.preapproval_id ?? null,
          plan: user.plan as never,
          amount: mpPayment.transaction_amount ?? 0,
          currency: mpPayment.currency_id ?? 'BRL',
          status: paymentStatus,
          paidAt: mpPayment.date_approved ? new Date(mpPayment.date_approved) : null,
          periodStart: mpPayment.date_created ? new Date(mpPayment.date_created) : null,
        },
      })

      if (eventId) await markWebhookEvent(eventId)
    }
  } catch (err) {
    logger.error('Error processing event', err)
    if (eventId) await markWebhookEvent(eventId, err instanceof Error ? err.message : String(err))
    // Falha real de processamento (rede, DB, etc.) — devolve 500 para o Mercado
    // Pago reenviar o evento automaticamente. Antes disso retornava 200 sempre,
    // e um erro transitório durante um deploy perdia o evento para sempre.
    return NextResponse.json({ error: 'Falha ao processar evento.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
