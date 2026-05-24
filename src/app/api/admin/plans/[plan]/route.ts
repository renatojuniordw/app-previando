import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

function requireAdmin(session: Session | null, req: NextRequest) {
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function PATCH(req: NextRequest, { params }: { params: { plan: string } }) {
  const session = await auth()
  const guard = requireAdmin(session, req)
  if (guard) return guard

  if (!['FREE', 'SOLO', 'PRO'].includes(params.plan)) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const body = await req.json()
  const {
    maxClients,
    maxCalculationsPerMonth,
    maxOpinionsPerMonth,
    simulatorEnabled,
    retroativosEnabled,
    exportPdfEnabled,
    whatsappShareEnabled,
    watermarkEnabled,
  } = body

  const existing = await prisma.planLimit.findUnique({ where: { plan: params.plan as never } })
  if (!existing) return NextResponse.json({ error: 'PlanLimit não encontrado' }, { status: 404 })

  const updated = await prisma.planLimit.update({
    where: { plan: params.plan as never },
    data: {
      ...(maxClients !== undefined && { maxClients }),
      ...(maxCalculationsPerMonth !== undefined && { maxCalculationsPerMonth }),
      ...(maxOpinionsPerMonth !== undefined && { maxOpinionsPerMonth }),
      ...(simulatorEnabled !== undefined && { simulatorEnabled }),
      ...(retroativosEnabled !== undefined && { retroativosEnabled }),
      ...(exportPdfEnabled !== undefined && { exportPdfEnabled }),
      ...(whatsappShareEnabled !== undefined && { whatsappShareEnabled }),
      ...(watermarkEnabled !== undefined && { watermarkEnabled }),
    },
  })

  await logAudit({
    userId: session!.user!.id!,
    action: 'admin.plan.limit.change',
    resource: `plan:${params.plan}`,
    req,
    metadata: { changes: body },
  })

  return NextResponse.json({ planLimit: updated })
}
