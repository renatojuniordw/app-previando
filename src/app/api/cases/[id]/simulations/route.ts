import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership, verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'
import { runSimulationSchema } from './schema'
import { PrevidenciaService } from '@/services/previdencia-service'
import { projectSimulations } from '@/lib/previdencia-engine'
import { getSalarioVigente } from '@/lib/salario-minimo'
import { getRegrasVigentes } from '@/lib/regras-aposentadoria'
import type { CnisExtractedData } from '@/services/cnis/types'
import type { Prisma } from '@prisma/client'

interface ScenarioParams {
  elegivel?: boolean
  gender?: string
  dibProjetada?: string
  valorContribuicaoFutura?: number
  modalidade?: string
  tempoEspecialAnos?: number
  [key: string]: unknown
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const simulations = await prisma.simulation.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    // Enriquecimento e auto-healing para simulações antigas
    const hasOldSimulations = simulations.some(sim => {
      const p = sim.scenarioParams as ScenarioParams | null
      return !p || typeof p !== 'object' || !('elegivel' in p)
    })

    let enrichedSimulations = simulations

    if (hasOldSimulations) {
      const cnis = await prisma.cnisDocument.findFirst({
        where: { client: { cases: { some: { id: params.id } } }, processingStatus: { in: ['COMPLETED', 'SUMMARY_READY'] } },
      })
      const extracted = cnis?.extractedData as CnisExtractedData | null
      const birthDate = extracted?.dataNascimento

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
            const p = sim.scenarioParams as ScenarioParams | null
            if (p && typeof p === 'object' && 'elegivel' in p) {
              return sim
            }

            try {
              const res = projectSimulations({
                birthDate,
                gender: (p?.gender as 'M' | 'F') || defaultGender,
                dibProjetada: p?.dibProjetada || sim.dibProjected.toISOString().slice(0, 10),
                valorContribuicaoFutura: Number(p?.valorContribuicaoFutura) || 1621.00,
                extractedData: extracted,
                modalidade: p?.modalidade || 'APOSENTADORIA_IDADE',
                tempoEspecialAnos: Number(p?.tempoEspecialAnos) || 0,
                salarioMinimo: salarioVigente.valor,
                tetoPrevidenciario: salarioVigente.teto,
                regrasVigentes,
              })

              await prisma.simulation.update({
                where: { id: sim.id },
                data: { scenarioParams: res.scenarioParams as Prisma.InputJsonValue },
              }).catch(() => {})

              return {
                ...sim,
                scenarioParams: res.scenarioParams as Prisma.JsonValue,
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

    await guardFeature(session.user.plan, 'SIMULATOR')
    await verifyCaseOwnershipAndActive(params.id, session.user.id)

    const parsed = runSimulationSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const simulation = await PrevidenciaService.runAndSaveSimulation({
      caseId: params.id,
      scenarioName: parsed.data.scenarioName,
      gender: parsed.data.gender,
      dibProjetada: parsed.data.dibProjetada,
      valorContribuicaoFutura: parsed.data.valorContribuicaoFutura,
      modalidade: parsed.data.modalidade,
      tempoEspecialAnos: parsed.data.tempoEspecialAnos,
    })

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
