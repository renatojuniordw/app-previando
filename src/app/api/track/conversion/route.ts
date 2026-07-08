import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'

// Registra eventos do funil de conversão (paywall → CTA). Fire-and-forget
// pelo client: qualquer falha aqui não pode afetar a UX, por isso o endpoint
// nunca retorna erro por problema de gravação — só por auth/validação.

const trackSchema = z.object({
  event: z.enum(['TEASER_VIEW', 'TEASER_CTA_CLICK', 'PAYWALL_MODAL_VIEW', 'PAYWALL_MODAL_CTA_CLICK']),
  feature: z.string().min(1).max(50),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const limit = await rateLimit(`track:${session.user.id}`, 60, 3600)
    if (!limit.success) return new NextResponse(null, { status: 204 })

    const parsed = trackSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 })
    }

    await prisma.conversionEvent.create({
      data: {
        userId: session.user.id,
        event: parsed.data.event,
        feature: parsed.data.feature,
        plan: session.user.plan,
      },
    }).catch(() => {
      // Telemetria não crítica — nunca propagar falha de gravação
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
