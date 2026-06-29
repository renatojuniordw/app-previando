import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { Logger } from '@/lib/logger'
import type { TrackJudWebhookPayload } from '@/services/trackjud'

const logger = new Logger('WebhookTrackJud')

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.TRACKJUD_WEBHOOK_SECRET
  if (!secret) {
    logger.warn('TRACKJUD_WEBHOOK_SECRET não configurada')
    return false
  }

  const signature = req.headers.get('x-trackjud-signature')
  if (!signature) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  // Rate limit: 100 req/min por IP
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const rl = await rateLimit(`webhook:trackjud:${ip}`, 100, 60)
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const rawBody = await req.text()

  // Validar assinatura HMAC-SHA256
  if (!verifySignature(req, rawBody)) {
    logger.warn('Assinatura HMAC inválida no webhook TrackJud')
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  let payload: TrackJudWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { monitorId, processNumber, movements, totalMovements, timestamp } = payload

  if (!monitorId || !processNumber) {
    return NextResponse.json({ error: 'monitorId e processNumber são obrigatórios' }, { status: 400 })
  }

  try {
    // Buscar caso pelo trackjudMonitorId — nunca por processNumber (previne abuso)
    const caso = await prisma.case.findFirst({
      where: { trackjudMonitorId: monitorId },
      select: { id: true, userId: true, client: { select: { name: true } } },
    })

    if (!caso) {
      logger.warn(`Webhook recebido para monitorId inexistente: ${monitorId}`)
      return NextResponse.json({ error: 'Monitor não encontrado' }, { status: 404 })
    }

    // Determinar última movimentação
    const lastMov = movements?.length
      ? movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null

    const lastMovDate = lastMov?.date ? new Date(lastMov.date) : null
    const lastMovDesc = lastMov?.description ?? null

    // Buscar contagem anterior para comparar
    const casoAnterior = await prisma.case.findUnique({
      where: { id: caso.id },
      select: { processLastMovCount: true },
    })

    const prevCount = casoAnterior?.processLastMovCount ?? 0
    const hasNewMovements = totalMovements > prevCount

    // Atualizar dados do caso
    await prisma.case.update({
      where: { id: caso.id },
      data: {
        processLastCheck: new Date(),
        processLastMovDate: lastMovDate,
        processLastMovCount: totalMovements,
        processLastSummary: lastMovDesc,
        processNumber, // Atualiza caso o TrackJud normalize o número
      },
    })

    // Criar notificação se houver movimentação nova (com deduplicação de 24h)
    if (hasNewMovements && lastMov) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId: caso.userId,
          caseId: caso.id,
          type: 'PROCESS_UPDATE',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      })

      if (!alreadyNotified) {
        const diff = totalMovements - prevCount
        const movDesc = lastMovDesc ? ` Última movimentação: "${lastMovDesc}".` : ''
        await prisma.notification.create({
          data: {
            userId: caso.userId,
            caseId: caso.id,
            type: 'PROCESS_UPDATE',
            message: `Nova movimentação no processo de ${caso.client?.name ?? 'Cliente'} (${diff} nova${diff > 1 ? 's' : ''}).${movDesc}`,
          },
        })
      }
    }

    logger.info(`Webhook processado: monitorId=${monitorId} mov=${totalMovements}`)
  } catch (err) {
    logger.error('Erro ao processar webhook TrackJud', err)
    // Não retorna erro — TrackJud faria retry desnecessário
  }

  return NextResponse.json({ received: true })
}
