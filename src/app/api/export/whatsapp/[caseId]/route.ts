import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'

function buildWhatsAppMessage(params: {
  processNumber: string
  lastMovDate: Date | null
  summary: string
  clientName: string
}): string {
  return `⚖️ *Atualização do seu processo*

📋 Processo: ${params.processNumber}
📅 Última movimentação: ${params.lastMovDate ? formatDate(params.lastMovDate) : 'N/A'}
👤 ${params.clientName}

${params.summary}

_Para dúvidas jurídicas, consulte seu advogado._
_Informação gerada via Previando (app.previando.com.br)_
_Previando é um produto Unificando_`
}

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const limit = await rateLimit(`sensitive:${session.user.id}`, 30, 60)
    if (!limit.success) return NextResponse.json({ error: 'Limite de operações atingido.' }, { status: 429 })

    await guardFeature(session.user.plan, 'WHATSAPP_SHARE')
    await verifyCaseOwnership(params.caseId, session.user.id)

    const caso = await prisma.case.findUnique({
      where: { id: params.caseId },
      include: { client: { select: { name: true, phone: true } } },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })
    if (!caso.client?.phone) {
      return NextResponse.json(
        { error: 'Cliente não possui número de WhatsApp cadastrado.' },
        { status: 400 }
      )
    }
    if (!caso.processNumber) {
      return NextResponse.json({ error: 'Número de processo não cadastrado.' }, { status: 400 })
    }
    if (!caso.processLastSummary) {
      return NextResponse.json(
        { error: 'Consulte o processo primeiro para gerar o resumo.' },
        { status: 400 }
      )
    }

    const message = buildWhatsAppMessage({
      processNumber: caso.processNumber,
      lastMovDate: caso.processLastMovDate,
      summary: caso.processLastSummary,
      clientName: caso.client.name,
    })

    const phone = caso.client.phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

    return NextResponse.json({ phone, message, whatsappUrl })
  } catch (err) {
    return handleApiError(err)
  }
}
