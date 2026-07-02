import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { Logger } from '@/lib/logger'
import { verificarStatus } from '@/services/assinatura-digital'
import crypto from 'crypto'

const logger = new Logger('WebhookClicksign')

/**
 * Verifica a assinatura HMAC-SHA256 do webhook do Clicksign.
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))
  } catch {
    return false
  }
}

/**
 * POST /api/webhooks/clicksign
 * Recebe notificações de conclusão de assinatura do Clicksign.
 *
 * O Clicksign envia um POST com o payload contendo:
 * {
 *   event: "list.completed" | "list.cancelled" | "signer.sign" | ...
 *   data: { list: { key: string } }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    logger.info('Webhook Clicksign recebido')

    // Validar assinatura do webhook (se configurada)
    const clicksignSecret = process.env.CLICKSIGN_WEBHOOK_SECRET
    let body: { event?: string; data?: { list?: { key?: string }; document?: { key?: string } } }

    if (clicksignSecret) {
      const signature = req.headers.get('x-clicksign-signature')
      if (!signature) {
        logger.warn('Webhook sem assinatura, ignorando')
        return NextResponse.json({ error: 'Assinatura ausente.' }, { status: 401 })
      }
      const bodyText = await req.text()
      if (!verifySignature(bodyText, signature, clicksignSecret)) {
        logger.warn('Assinatura inválida do webhook Clicksign')
        return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 })
      }
      body = JSON.parse(bodyText)
    } else {
      body = await req.json().catch(() => null)
    }

    if (!body || !body.event || !body.data) {
      logger.warn('Payload inválido do webhook Clicksign')
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
    }

    const { event, data } = body

    // Extrair processoKey do payload
    const processoKey = data.list?.key ?? data.document?.key
    if (!processoKey) {
      logger.warn('Webhook sem processoKey', { event, data })
      return NextResponse.json({ error: 'processoKey não encontrado.' }, { status: 400 })
    }

    // Mapear eventos do Clicksign para status interno
    const statusMap: Record<string, string> = {
      'list.completed': 'SIGNED',
      'list.cancelled': 'CANCELLED',
      'list.expired': 'EXPIRED',
      'list.signed': 'SIGNED',
      'document.signed': 'SIGNED',
      'document.cancelled': 'CANCELLED',
    }

    const mappedStatus = statusMap[event]

    if (!mappedStatus) {
      // Eventos intermediários (ex: signer.sign) — consultar status atualizado
      logger.info(`Evento intermediário recebido: ${event}. Consultando status atualizado.`)

      try {
        const statusAtual = await verificarStatus(processoKey)

        if (statusAtual.status === 'completed' || statusAtual.status === 'signed') {
          await atualizarAssinatura(processoKey, 'SIGNED', statusAtual)
        }
      } catch (err) {
        logger.error('Erro ao verificar status após evento intermediário', err)
      }

      return NextResponse.json({ received: true })
    }

    // Atualizar status no banco
    await atualizarAssinatura(processoKey, mappedStatus)

    logger.info(`Assinatura atualizada: processoKey=${processoKey}, status=${mappedStatus}`)

    return NextResponse.json({ received: true })
  } catch (err) {
    logger.error('Erro no webhook Clicksign', err)
    return handleApiError(err)
  }
}

async function atualizarAssinatura(processoKey: string, status: string, statusAtual?: { signers: Array<{ name: string; email: string; status: string }> }) {
  const assinatura = await prisma.assinatura.findFirst({
    where: { processoKey },
    include: {
      case: { select: { userId: true, client: { select: { name: true } } } },
    },
  })

  if (!assinatura) {
    logger.warn(`Assinatura não encontrada para processoKey=${processoKey}`)
    return
  }

  // Atualizar signers se veio do status atual
  const signers = statusAtual?.signers ?? assinatura.signers

  await prisma.assinatura.update({
    where: { id: assinatura.id },
    data: {
      status,
      signers: signers as Parameters<typeof prisma.assinatura.update>[0]['data']['signers'],
      completedAt: status === 'SIGNED' ? new Date() : undefined,
    },
  })

  // Criar notificação in-app para o usuário
  if (status === 'SIGNED') {
    const tipoLabel = getTipoDocumentoLabel(assinatura.tipoDocumento)
    await prisma.notification.create({
      data: {
        userId: assinatura.case.userId,
        caseId: assinatura.caseId,
        type: 'SIGNATURE_COMPLETED',
        message: `Assinatura concluída: ${tipoLabel} do caso ${assinatura.case.client?.name ?? 'Cliente'} foi assinado por todos os signatários.`,
      },
    }).catch((err) => {
      logger.error('Erro ao criar notificação de assinatura', err)
    })
  }
}

function getTipoDocumentoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    PROCURACAO: 'Procuração',
    PETICAO: 'Petição Inicial',
    CONTRATO: 'Contrato de Honorários',
  }
  return labels[tipo] ?? tipo
}
