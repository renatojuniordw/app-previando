import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { handleApiError } from '@/lib/api-error'
import { invalidatePlanLimitCache, reconcileClientActivation } from '@/lib/plan-guard'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const body = await req.json()
    const { plan } = body

    if (!['FREE', 'SOLO', 'PRO', 'PARTNER'].includes(plan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    // Ao definir PARTNER, remove vínculo com Mercado Pago
    const resetMp = plan === 'PARTNER'
      ? { mpSubscriptionId: null, mpSubscriptionStatus: null, mpCustomerId: null }
      : {}

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    await prisma.user.update({ where: { id: params.id }, data: { plan, planStatus: 'ACTIVE', ...resetMp } })
    await invalidatePlanLimitCache(plan)
    if (plan !== user.plan) {
      await reconcileClientActivation(params.id, plan)
    }

    await logAudit({
      userId: adminResult.userId,
      action: 'admin.plan.change',
      resource: `user:${params.id}`,
      req,
      metadata: { previousPlan: user.plan, newPlan: plan },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
