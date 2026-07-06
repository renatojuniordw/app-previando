import { prisma } from '@/lib/prisma'
import { calculateRetroativos } from '@/lib/retroativos-engine'
import type { Prisma } from '@prisma/client'

export interface RunRetroativoInput {
  caseId: string
  dataInicioDireito: string
  dataRequerimento: string
  valorMensalBruto: number
  valorDescontos?: number
  descricaoDescontos?: string
  percentualHonorarios?: number
}

/**
 * Orquestrador responsável pela execução e persistência de parcelas vencidas retroativas.
 * Aplica o Princípio da Responsabilidade Única (SRP) isolando a liquidação judicial e financeira.
 */
export class RetroativoOrchestrator {
  /**
   * Executa a orquestração e cálculo seguro de parcelas vencidas retroativas no servidor
   * e salva no banco de dados.
   */
  static async run(input: RunRetroativoInput) {
    const { caseId, dataInicioDireito, dataRequerimento, valorMensalBruto, valorDescontos = 0, descricaoDescontos, percentualHonorarios } = input

    // 1. Busca todos os índices INPC históricos parametrizados no banco
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

    // 2. Executa o cálculo de parcelas atrasadas e atualização monetária pelo INPC carregado do banco
    const result = calculateRetroativos({
      dataInicioDireito,
      dataRequerimento,
      valorMensalBruto,
      valorDescontos,
      descricaoDescontos,
      percentualHonorarios,
      indicesINPC,
    })

    // 3. Salva o retroativo e, se houver percentual de honorários, o honorário vinculado numa única transação
    const retroativo = await prisma.$transaction(async (tx) => {
      const created = await tx.retroactive.create({
        data: {
          caseId,
          entitlementStartDate: new Date(result.dataInicioDireito),
          requestDate: new Date(result.dataRequerimento),
          monthsLate: result.mesesAtraso,
          monthlyGrossValue: result.valorMensalBruto,
          totalGrossValue: result.valorTotalBruto,
          totalCorrectedValue: result.valorTotalCorrigido,
          correctionIndex: result.indiceCorrecao,
          discountValue: result.valorDescontos,
          discountDescription: result.descricaoDescontos ?? null,
          finalNetValue: result.valorLiquidoFinal,
          feePercentage: result.percentualHonorarios ?? null,
          feeValue: result.valorHonorarios ?? null,
          clientNetValue: result.valorLiquidoCliente ?? null,
          calculationMemory: result.memoriaCalculo as unknown as Prisma.InputJsonValue,
        },
      })

      if (result.percentualHonorarios !== undefined && result.valorHonorarios !== undefined) {
        await tx.fee.create({
          data: {
            caseId,
            retroactiveId: created.id,
            description: `Honorários sobre retroativo (${result.percentualHonorarios}%)`,
            type: 'PERCENTAGE',
            totalAmount: result.valorHonorarios,
          },
        })
      }

      return created
    })

    return retroativo
  }
}
