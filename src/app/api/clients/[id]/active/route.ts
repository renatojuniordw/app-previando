import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { verifyClientOwnership } from '@/lib/ownership'
import { getPlanLimit } from '@/lib/plan-guard'
import { handleApiError, PlanLimitError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'

const bodySchema = z.object({ active: z.boolean() })

// Ativa/desativa manualmente um cliente. Ativar respeita o limite de
// clientes ativos do plano atual; desativar é sempre permitido e libera
// espaço para ativar outro cliente ou cadastrar um novo.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyClientOwnership(params.id, session.user.id)

    const { success: limitOk } = await rateLimit(`client-active:${session.user.id}`, 20, 3600)
    if (!limitOk) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    if (parsed.data.active) {
      const limit = await getPlanLimit(session.user.plan)
      if (limit.maxClients !== -1) {
        const activeCount = await prisma.client.count({
          where: { userId: session.user.id, active: true, id: { not: params.id } },
        })
        if (activeCount >= limit.maxClients) {
          throw new PlanLimitError(
            `Você já tem ${limit.maxClients} clientes ativos, o limite do plano ${session.user.plan}. Desative outro cliente antes de ativar este, ou atualize seu plano.`,
            'CLIENT_OVER_LIMIT',
            session.user.plan === 'FREE' ? 'SOLO' : 'PRO'
          )
        }
      }
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: { active: parsed.data.active },
    })

    await logAudit({
      userId: session.user.id,
      action: parsed.data.active ? 'client.activated' : 'client.deactivated',
      resource: client.name,
      req,
      metadata: { clientId: client.id },
    })

    return NextResponse.json({ client: { id: client.id, active: client.active } })
  } catch (err) {
    return handleApiError(err)
  }
}
