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
    const { action } = body

    if (!['suspend', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const newStatus = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE'

    await prisma.user.update({ where: { id: params.id }, data: { planStatus: newStatus } })
    await invalidatePlanLimitCache(user.plan)

    await logAudit({
      userId: adminResult.userId,
      action: action === 'suspend' ? 'admin.user.suspend' : 'admin.user.activate',
      resource: `user:${params.id}`,
      req,
      metadata: { targetEmail: user.email },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
