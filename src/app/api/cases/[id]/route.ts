import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { sanitizeInput } from '@/lib/sanitize'
import { handleApiError } from '@/lib/api-error'
import { getPlanLimit } from '@/lib/plan-guard'

const updateSchema = z.object({
  status: z.enum(['PROSPECCAO', 'ANALISE', 'PRONTO_PARA_REQUERER', 'EM_PROCESSAMENTO', 'FINALIZADO']).optional(),
  priority: z.enum(['CRITICAL', 'ATTENTION', 'NORMAL']).optional(),
  deadlineDays: z.number().int().positive().nullable().optional(),
  deadlineDate: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  processNumber: z.string().nullable().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        cnisDocument: true,
        calculations: { orderBy: { createdAt: 'desc' } },
        opinions: { orderBy: { createdAt: 'desc' }, select: { id: true, status: true, createdAt: true } },
        checklists: { orderBy: { createdAt: 'desc' }, take: 1 },
        simulations: { orderBy: { createdAt: 'desc' } },
        retroativos: { orderBy: { createdAt: 'desc' } },
        _count: { select: { caseNotes: true } },
      },
    })

    const planLimits = await getPlanLimit(session.user.plan)

    return NextResponse.json({
      case: {
        ...caso,
        planLimits: {
          datajudEnabled: planLimits.datajudEnabled,
          simulatorEnabled: planLimits.simulatorEnabled,
          retroativosEnabled: planLimits.retroativosEnabled,
        },
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.status) data.status = parsed.data.status
    if (parsed.data.priority) data.priority = parsed.data.priority
    if (parsed.data.deadlineDays !== undefined) data.deadlineDays = parsed.data.deadlineDays
    if (parsed.data.deadlineDate !== undefined)
      data.deadlineDate = parsed.data.deadlineDate ? new Date(parsed.data.deadlineDate) : null
    if (parsed.data.notes !== undefined)
      data.notes = parsed.data.notes ? sanitizeInput(parsed.data.notes) : null

    const caso = await prisma.case.update({ where: { id: params.id }, data })
    return NextResponse.json({ case: caso })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    await prisma.case.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
