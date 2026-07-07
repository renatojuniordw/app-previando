import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership, verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'
import { PrevidenciaService } from '@/services/previdencia-service'

const createSchema = z.object({
  dataRequerimentoAdministrativo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD).'),
  dataAjuizamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD).'),
  dataInicioDireito: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD).'),
}).strict()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const causeValueCalculations = await prisma.causeValueCalculation.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ causeValueCalculations })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    // Valor da causa é exclusivo do fluxo de BPC/LOAS — reaproveita o gate de plano do módulo BPC
    await guardFeature(session.user.plan, 'USE_BPC_MODULE')

    // Validação estrita de posse do caso (Anti-IDOR)
    await verifyCaseOwnershipAndActive(params.id, session.user.id)

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const causeValueCalculation = await PrevidenciaService.runAndSaveCauseValue({
      caseId: params.id,
      dataRequerimentoAdministrativo: parsed.data.dataRequerimentoAdministrativo,
      dataAjuizamento: parsed.data.dataAjuizamento,
      dataInicioDireito: parsed.data.dataInicioDireito,
    })

    await logAudit({
      userId: session.user.id,
      action: 'cause_value.created',
      resource: 'Valor da causa calculado',
      req,
      metadata: { caseId: params.id, causeValueCalculationId: causeValueCalculation.id },
    })

    return NextResponse.json({ causeValueCalculation }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
