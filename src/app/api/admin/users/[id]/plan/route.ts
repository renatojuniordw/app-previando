import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { handleApiError } from '@/lib/api-error'
import { invalidatePlanLimitCache } from '@/lib/plan-guard'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const body = await req.json()
    const { plan } = body

    if (!['FREE', 'SOLO', 'PRO'].includes(plan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    await prisma.user.update({ where: { id: params.id }, data: { plan, planStatus: 'ACTIVE' } })
    await invalidatePlanLimitCache(plan)

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
