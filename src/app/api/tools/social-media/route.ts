import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { guardFeature, guardBpcSocialMediaLimit } from '@/lib/plan-guard'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { gerarCarrossel } from '@/services/bpc'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  tema: z.string().min(1).max(500),
  contexto: z.string().max(3000).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await guardFeature(session.user.plan, 'BPC_SOCIAL_MEDIA')
    await guardBpcSocialMediaLimit(session.user.id, session.user.plan)

    const { success } = await rateLimit(`bpc-social:${session.user.id}`, 15, 3600)
    if (!success) return NextResponse.json({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }, { status: 429 })

    const body = await req.json()
    const { tema, contexto } = Schema.parse(body)

    const result = await gerarCarrossel(tema, contexto ?? '')

    const limit = await prisma.planLimit.findUnique({ where: { plan: session.user.plan as import('@prisma/client').Plan } })
    if (limit && limit.bpcSocialMediaPerMonth !== -1) {
      await prisma.usageRecord.upsert({
        where: { userId: session.user.id },
        update: { bpcSocialMediaThisMonth: { increment: 1 } },
        create: { userId: session.user.id, bpcSocialMediaThisMonth: 1 },
      })
    }

    await logAudit({
      userId: session.user.id,
      action: 'bpc.social-media',
      resource: 'Carrossel BPC gerado (ferramenta avulsa)',
      req,
      metadata: { tema },
    })

    return NextResponse.json({ result })
  } catch (err: unknown) {
    return handleApiError(err)
  }
}
