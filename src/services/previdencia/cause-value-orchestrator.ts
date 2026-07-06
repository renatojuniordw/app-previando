import { prisma } from '@/lib/prisma'
import { calculateCauseValue } from '@/lib/cause-value-engine'
import { getSalarioVigente } from '@/lib/salario-minimo'
import type { Prisma } from '@prisma/client'

export interface RunCauseValueInput {
  caseId: string
  dataRequerimentoAdministrativo: string
  dataAjuizamento: string
  dataInicioDireito: string
}

/**
 * Orquestrador responsável pelo cálculo do valor da causa em ações de BPC/LOAS.
 * Aplica o Princípio da Responsabilidade Única (SRP) isolando esse fluxo dos
 * cálculos de RMI/elegibilidade e da liquidação de retroativos.
 */
export class CauseValueOrchestrator {
  static async run(input: RunCauseValueInput) {
    const { caseId, dataRequerimentoAdministrativo, dataAjuizamento, dataInicioDireito } = input

    // 1. Salário mínimo vigente na data do ajuizamento
    const salarioVigente = await getSalarioVigente(dataAjuizamento)

    // 2. Índices INPC — mesma fonte usada pelo RetroativoOrchestrator
    const dbIndices = await prisma.inpcIndex.findMany()

    if (dbIndices.length === 0) {
      throw new Error(
        'Nenhum índice do INPC foi encontrado no banco de dados. ' +
        'Por favor, certifique-se de que o seed do banco de dados (npx prisma db seed) foi executado com sucesso.'
      )
    }

    const indicesINPC: Record<string, number> = {}
    for (const ind of dbIndices) {
      indicesINPC[ind.competence] = Number(ind.value)
    }

    // 3. Executa o cálculo puro do valor da causa
    const result = calculateCauseValue({
      dataRequerimentoAdministrativo,
      dataAjuizamento,
      dataInicioDireito,
      valorSalarioMinimoVigente: salarioVigente.valor,
      indicesINPC,
    })

    // 4. Salva no banco de dados
    return prisma.causeValueCalculation.create({
      data: {
        caseId,
        administrativeRequestDate: new Date(result.dataRequerimentoAdministrativo),
        lawsuitFilingDate: new Date(result.dataAjuizamento),
        entitlementStartDate: new Date(result.dataInicioDireito),
        monthlyGrossValue: salarioVigente.valor,
        monthsLate: result.mesesAtraso,
        totalCorrectedValue: result.valorTotalCorrigido,
        correctionIndex: result.indiceCorrecao,
        futureInstallmentsCount: result.numeroParcelasVincendas,
        futureInstallmentsValue: result.valorParcelaVincenda,
        futureInstallmentsTotal: result.valorTotalVincendas,
        totalCauseValue: result.valorDaCausa,
        calculationMemory: result.memoriaCalculo as unknown as Prisma.InputJsonValue,
      },
    })
  }
}
