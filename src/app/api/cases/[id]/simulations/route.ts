import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'
import { runSimulationSchema } from './schema'
import { PrevidenciaService } from '@/services/previdencia-service'
import { projectSimulations } from '@/lib/previdencia-engine'
import { getSalarioVigente } from '@/lib/salario-minimo'
import { getRegrasVigentes } from '@/lib/regras-aposentadoria'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const simulations = await prisma.simulation.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    // Enriquecimento e auto-healing para simulações antigas que não possuem elegibilidade/idade no banco
    const hasOldSimulations = simulations.some(sim => {
      const p = sim.scenarioParams as any
      return !p || typeof p !== 'object' || !('elegivel' in p)
    })

    let enrichedSimulations = simulations

    if (hasOldSimulations) {
      const cnis = await prisma.cnisDocument.findFirst({
        where: { caseId: params.id, processingStatus: { in: ['COMPLETED', 'SUMMARY_READY'] } },
      })
      const extracted = cnis?.extractedData as any
      const birthDate = extracted?.dataNascimento as string | undefined

      if (birthDate) {
        const hojeStr = new Date().toISOString().slice(0, 10)
        const [salarioVigente, regrasVigentes, latestCalc] = await Promise.all([
          getSalarioVigente(hojeStr),
          getRegrasVigentes(hojeStr),
          prisma.calculation.findFirst({
            where: { caseId: params.id },
            orderBy: { createdAt: 'desc' },
          })
        ])

        const latestCalcInput = latestCalc?.inputParams as { gender?: 'M' | 'F' } | null | undefined
        const defaultGender = latestCalcInput?.gender || 'F'

        enrichedSimulations = await Promise.all(
          simulations.map(async (sim) => {
            const p = sim.scenarioParams as any
            if (p && typeof p === 'object' && 'elegivel' in p) {
              return sim
            }

            try {
              const res = projectSimulations({
                birthDate,
                gender: p?.gender || defaultGender,
                dibProjetada: p?.dibProjetada || sim.dibProjected.toISOString().slice(0, 10),
                valorContribuicaoFutura: Number(p?.valorContribuicaoFutura) || 1621.00,
                extractedData: extracted,
                modalidade: p?.modalidade || 'APOSENTADORIA_IDADE',
                tempoEspecialAnos: Number(p?.tempoEspecialAnos) || 0,
                salarioMinimo: salarioVigente.valor,
                tetoPrevidenciario: salarioVigente.teto,
                regrasVigentes,
              })

              // Salva assincronamente no DB para auto-healing
              await prisma.simulation.update({
                where: { id: sim.id },
                data: { scenarioParams: res.scenarioParams as any },
              }).catch(() => {})

              return {
                ...sim,
                scenarioParams: res.scenarioParams as any,
              }
            } catch {
              return sim
            }
          })
        )
      }
    }

    return NextResponse.json({ simulations: enrichedSimulations })
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
      tempoEspecialAnos: parsed.data.tempoEspecialAnos,
    })

    // Registrar log de atividade
    await logAudit({
      userId: session.user.id,
      action: 'simulation.created',
      resource: `Simulação (${simulation.scenarioName}) realizada`,
      req,
      metadata: { caseId: params.id, simulationId: simulation.id },
    })

    return NextResponse.json({ simulation }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

