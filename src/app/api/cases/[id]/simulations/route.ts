import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { runSimulationSchema } from './schema'
import { PrevidenciaService } from '@/services/previdencia-service'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const simulations = await prisma.simulation.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ simulations })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    // Validação de acesso à feature do simulador baseado no plano SaaS
    await guardFeature(session.user.plan, 'SIMULATOR')
    
    // Validação estrita de posse do caso (Anti-IDOR)
    await verifyCaseOwnership(params.id, session.user.id)

    // Validação estrita dos parâmetros do cenário
    const parsed = runSimulationSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    // Execução e persistência seguras ocorrendo estritamente no backend
    const simulation = await PrevidenciaService.runAndSaveSimulation({
      caseId: params.id,
      scenarioName: parsed.data.scenarioName,
      gender: parsed.data.gender,
      dibProjetada: parsed.data.dibProjetada,
      valorContribuicaoFutura: parsed.data.valorContribuicaoFutura,
      modalidade: parsed.data.modalidade,
    })

    return NextResponse.json({ simulation }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

