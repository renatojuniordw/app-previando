import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyClientOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { sendWhatsAppMessage } from '@/services/whatsapp'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'

const schema = z.object({
  message: z.string().min(1).max(4096),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await guardFeature(session.user.plan, 'WHATSAPP_SHARE')
    await verifyClientOwnership(params.id, session.user.id)

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 })
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, phone: true },
    })

    if (!client?.phone) {
      return NextResponse.json(
        { error: 'Cliente não possui telefone cadastrado.' },
        { status: 400 }
      )
    }

    const phone = client.phone.replace(/\D/g, '')
    if (phone.length < 10) {
      return NextResponse.json({ error: 'Número de telefone inválido.' }, { status: 400 })
    }

    const result = await sendWhatsAppMessage({ to: phone, text: parsed.data.message })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Falha ao enviar mensagem.' },
        { status: 502 }
      )
    }

    await logAudit({
      userId: session.user.id,
      action: 'whatsapp.send',
      resource: `client:${params.id}`,
      req,
      metadata: { messageId: result.messageId },
    })

    return NextResponse.json({ ok: true, messageId: result.messageId })
  } catch (err) {
    return handleApiError(err)
  }
}
