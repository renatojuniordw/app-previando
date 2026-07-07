import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { verifyCaseOwnership, verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { guardCalculationLimit, tryConsumeMonthlyUsage } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'
import { runCalculationSchema } from './schema'
import { PrevidenciaService } from '@/services/previdencia-service'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const calculations = await prisma.calculation.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ calculations })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    // Validação estrita de posse do caso (Anti-IDOR)
    await verifyCaseOwnershipAndActive(params.id, session.user.id)

    const { success: limitOk } = await rateLimit(`calculations:${session.user.id}`, 10, 3600)
    if (!limitOk) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })

    await guardCalculationLimit(session.user.id, session.user.plan)

    // Validação estrita dos parâmetros do cliente
    const parsed = runCalculationSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    // Execução e persistência seguras ocorrendo estritamente no backend
    const calc = await PrevidenciaService.runAndSaveCalculation({
      caseId: params.id,
      modalidade: parsed.data.modalidade,
      dib: parsed.data.dib,
      gender: parsed.data.gender,
      tempoEspecialAnos: parsed.data.tempoEspecialAnos,
      dependentesPensao: parsed.data.dependentesPensao,
      disabilityDegree: parsed.data.disabilityDegree,
      converterTempoComumPCD: parsed.data.converterTempoComumPCD,
    })

    // Incrementa contador mensal de uso do plano (atômico — evita estourar o limite em corridas)
    await tryConsumeMonthlyUsage(session.user.id, session.user.plan, 'calculationsThisMonth')

    // Registrar log de atividade
    await logAudit({
      userId: session.user.id,
      action: 'calculation.created',
      resource: `Cálculo (${calc.modality.replace(/_/g, ' ')}) realizado`,
      req,
      metadata: { caseId: params.id, calculationId: calc.id },
    })

    return NextResponse.json({ calculation: calc }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

