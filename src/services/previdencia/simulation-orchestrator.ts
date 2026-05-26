import { prisma } from '@/lib/prisma'
import { projectSimulations } from '@/lib/previdencia-engine'
import { getSalarioVigente } from '@/lib/salario-minimo'
import { getRegrasVigentes } from '@/lib/regras-aposentadoria'
import { findAndValidateCnis } from './helpers'

export interface RunSimulationInput {
  caseId: string
  scenarioName: string
  gender: 'M' | 'F'
  dibProjetada: string
  valorContribuicaoFutura: number
  modalidade: string
}

/**
 * Orquestrador responsável pela execução e persistência de Simulações de Planejamento Previdenciário.
 * Aplica o Princípio da Responsabilidade Única (SRP) isolando o planejamento de cenários futuros.
 */
export class SimulationOrchestrator {
  /**
   * Executa a orquestração segura da simulação de planejamento no servidor
   * e salva no banco de dados.
   */
  static async run(input: RunSimulationInput) {
    const { caseId, scenarioName, gender, dibProjetada, valorContribuicaoFutura, modalidade } = input

    // 1. Busca e valida o documento CNIS utilizando o helper centralizado
    const { extracted } = await findAndValidateCnis(caseId)
    const birthDate = extracted?.dataNascimento as string | undefined

    if (!birthDate) {
      throw new Error('Data de nascimento do segurado ausente ou não identificada no CNIS.')
    }

    // 2. Busca parâmetros legais na DIB projetada (e hoje para comparação)
    const hojeStr = new Date().toISOString().slice(0, 10)
    const [salarioVigente, regrasVigentes] = await Promise.all([
      getSalarioVigente(hojeStr),
      getRegrasVigentes(hojeStr),
    ])

    // 3. Executa a projeção previdenciária (Pure Domain Logic)
    const result = projectSimulations({
      birthDate,
      gender,
      dibProjetada,
      valorContribuicaoFutura,
      extractedData: extracted,
      modalidade,
      salarioMinimo: salarioVigente.valor,
      tetoPrevidenciario: salarioVigente.teto,
      regrasVigentes,
    })

    // 4. Salva a simulação no banco
    const simulation = await prisma.simulation.create({
      data: {
        caseId,
        scenarioName,
        scenarioParams: result.scenarioParams as unknown as object,
        rmiProjected: result.rmiProjected,
        rmaProjected: result.rmaProjected,
        dibProjected: new Date(result.dibProjected),
        gainVsNow: result.gainVsNow,
      },
    })

    return simulation
  }
}
