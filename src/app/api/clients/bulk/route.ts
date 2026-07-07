import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getPlanLimit } from '@/lib/plan-guard'
import { handleApiError, PlanLimitError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'

const bodySchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(200),
  action: z.enum(['activate', 'deactivate', 'delete']),
})

// Ações em lote sobre clientes do próprio usuário — usado principalmente
// para gerenciar clientes excedentes ao limite do plano após um downgrade
// (ativar/desativar/excluir vários de uma vez).
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const { ids, action } = parsed.data

    // Filtra por posse — ids que não pertencem ao usuário são silenciosamente ignorados (anti-IDOR)
    const owned = await prisma.client.findMany({
      where: { id: { in: ids }, userId: session.user.id },
      select: { id: true, name: true },
    })
    const ownedIds = owned.map((c) => c.id)

    if (ownedIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum cliente encontrado.' }, { status: 404 })
    }

    if (action === 'activate') {
      const limit = await getPlanLimit(session.user.plan)
      if (limit.maxClients !== -1) {
        const activeCount = await prisma.client.count({
          where: { userId: session.user.id, active: true, id: { notIn: ownedIds } },
        })
        if (activeCount + ownedIds.length > limit.maxClients) {
          const vagas = Math.max(limit.maxClients - activeCount, 0)
          throw new PlanLimitError(
            `Seu plano ${session.user.plan} permite até ${limit.maxClients} clientes ativos. Você só tem espaço para ativar mais ${vagas}. Desative outros clientes ou atualize seu plano.`,
            'CLIENT_OVER_LIMIT',
            session.user.plan === 'FREE' ? 'SOLO' : 'PRO'
          )
        }
      }

      await prisma.client.updateMany({ where: { id: { in: ownedIds } }, data: { active: true } })
    } else if (action === 'deactivate') {
      await prisma.client.updateMany({ where: { id: { in: ownedIds } }, data: { active: false } })
    } else {
      await prisma.client.deleteMany({ where: { id: { in: ownedIds } } })
      await prisma.usageRecord.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id },
        update: { totalClients: { decrement: ownedIds.length } },
      })
    }

    await logAudit({
      userId: session.user.id,
      action: `client.bulk.${action}`,
      resource: `${ownedIds.length} cliente(s)`,
      req,
      metadata: { clientIds: ownedIds },
    })

    return NextResponse.json({ success: true, count: ownedIds.length })
  } catch (err) {
    return handleApiError(err)
  }
}
