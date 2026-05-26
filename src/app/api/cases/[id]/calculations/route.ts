import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardCalculationLimit } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
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
    await verifyCaseOwnership(params.id, session.user.id)
    
    // Validação de limites de uso mensais do SaaS
    await guardCalculationLimit(session.user.id, session.user.plan)

    // Validação estrita dos parâmetros do cliente
    const parsed = runCalculationSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    // Execução e persistência seguras ocorrendo estritamente no backend
    const calc = await PrevidenciaService.runAndSaveCalculation({
      caseId: params.id,
      modalidade: parsed.data.modalidade,
      dib: parsed.data.dib,
      gender: parsed.data.gender,
      tempoEspecialAnos: parsed.data.tempoEspecialAnos,
      dependentesPensao: parsed.data.dependentesPensao,
    })

    // Incrementa contador mensal de uso do plano
    await prisma.usageRecord.update({
      where: { userId: session.user.id },
      data: { calculationsThisMonth: { increment: 1 } },
    })

    return NextResponse.json({ calculation: calc }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

