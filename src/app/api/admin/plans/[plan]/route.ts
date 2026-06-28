import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { handleApiError } from '@/lib/api-error'
import { invalidatePlanLimitCache } from '@/lib/plan-guard'

export async function PATCH(req: NextRequest, { params }: { params: { plan: string } }) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    if (!['FREE', 'SOLO', 'PRO'].includes(params.plan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const body = await req.json()
    const {
      maxClients,
      maxCalculationsPerMonth,
      maxOpinionsPerMonth,
      maxNotesPerCase,
      simulatorEnabled,
      retroactiveEnabled,
      exportPdfEnabled,
      whatsappEnabled,
      watermarkEnabled,
      diagnosisEnabled,
      bpcEnabled,
      bpcAnalysesPerMonth,
      bpcSocialMediaPerMonth,
    } = body

    const existing = await prisma.planLimit.findUnique({ where: { plan: params.plan as never } })
    if (!existing) return NextResponse.json({ error: 'PlanLimit não encontrado' }, { status: 404 })

    const updated = await prisma.planLimit.update({
      where: { plan: params.plan as never },
      data: {
        ...(maxClients !== undefined && { maxClients }),
        ...(maxCalculationsPerMonth !== undefined && { maxCalculationsPerMonth }),
        ...(maxOpinionsPerMonth !== undefined && { maxOpinionsPerMonth }),
        ...(maxNotesPerCase !== undefined && { maxNotesPerCase }),
        ...(simulatorEnabled !== undefined && { simulatorEnabled }),
        ...(retroactiveEnabled !== undefined && { retroactiveEnabled }),
        ...(exportPdfEnabled !== undefined && { exportPdfEnabled }),
        ...(whatsappEnabled !== undefined && { whatsappEnabled }),
        ...(watermarkEnabled !== undefined && { watermarkEnabled }),
        ...(diagnosisEnabled !== undefined && { diagnosisEnabled }),
        ...(bpcEnabled !== undefined && { bpcEnabled }),
        ...(bpcAnalysesPerMonth !== undefined && { bpcAnalysesPerMonth }),
        ...(bpcSocialMediaPerMonth !== undefined && { bpcSocialMediaPerMonth }),
      },
    })

    await invalidatePlanLimitCache(params.plan)

    await logAudit({
      userId: adminResult.userId,
      action: 'admin.plan.limit.change',
      resource: `plan:${params.plan}`,
      req,
      metadata: { changes: body },
    })

    return NextResponse.json({ planLimit: updated })
  } catch (err) {
    return handleApiError(err)
  }
}
