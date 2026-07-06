/**
 * Motor de Correção de Retroativos - Previando
 * Atualização monetária de parcelas vencidas utilizando INPC histórico e fallbacks
 */

import { FALLBACK_INPC_MENSAL } from '@/lib/previdenciario-constants'

export interface RetroativoInput {
  dataInicioDireito: string // DIB: YYYY-MM-DD
  dataRequerimento: string  // DDB: YYYY-MM-DD
  valorMensalBruto: number
  valorDescontos?: number
  descricaoDescontos?: string
  percentualHonorarios?: number // % sobre o valor líquido final (0-100)
  indicesINPC: Record<string, number> // SST: Recebe os índices do banco carregados pelo service
}

export interface ParcelaRetroativa {
  competencia: string // MM/YYYY
  valorOriginal: number
  indiceINPC: number
  valorCorrigido: number
  mesesAtraso: number
}

export interface RetroativoResult {
  dataInicioDireito: string
  dataRequerimento: string
  mesesAtraso: number
  valorMensalBruto: number
  valorTotalBruto: number
  valorTotalCorrigido: number
  indiceCorrecao: string
  valorDescontos: number
  descricaoDescontos?: string
  valorLiquidoFinal: number
  percentualHonorarios?: number
  valorHonorarios?: number
  valorLiquidoCliente?: number
  memoriaCalculo: {
    parcelas: ParcelaRetroativa[]
    acumuladoINPC: number
  }
}

/**
 * Executa o cálculo de parcelas atrasadas e atualização monetária pelo INPC
 */
export function calculateRetroativos(input: RetroativoInput): RetroativoResult {
  const { dataInicioDireito, dataRequerimento, valorMensalBruto, valorDescontos = 0, descricaoDescontos, percentualHonorarios, indicesINPC } = input

  const start = new Date(dataInicioDireito)
  const end = new Date(dataRequerimento)

  if (start > end) {
    throw new Error('A data de início do direito não pode ser posterior à data de requerimento.')
  }

  const parcelas: ParcelaRetroativa[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  const limit = new Date(end.getFullYear(), end.getMonth(), 1)

  let valorTotalBruto = 0
  let valorTotalCorrigido = 0

  while (current <= limit) {
    const competenciaLabel = `${String(current.getMonth() + 1).padStart(2, '0')}/${current.getFullYear()}`

    // Calcula os meses de atraso desta parcela em relação à DDB
    const diffMeses = (limit.getFullYear() - current.getFullYear()) * 12 + (limit.getMonth() - current.getMonth())

    // Aplica correção pelo INPC acumulado de forma simplificada
    // Para cada mês de atraso, aplicamos o índice do histórico do banco ou a média de 0.35%
    let fatorCorrecao = 1.0
    const tempDate = new Date(current.getFullYear(), current.getMonth(), 1)

    while (tempDate < limit) {
      const stepKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`
      const indiceMes = indicesINPC[stepKey] ?? FALLBACK_INPC_MENSAL
      fatorCorrecao *= (1 + indiceMes)
      tempDate.setMonth(tempDate.getMonth() + 1)
    }

    const valorCorrigido = Number((valorMensalBruto * fatorCorrecao).toFixed(2))

    parcelas.push({
      competencia: competenciaLabel,
      valorOriginal: valorMensalBruto,
      indiceINPC: Number((fatorCorrecao - 1).toFixed(4)), // Percentual acumulado
      valorCorrigido,
      mesesAtraso: diffMeses
    })

    valorTotalBruto += valorMensalBruto
    valorTotalCorrigido += valorCorrigido

    // Incrementa 1 mês
    current.setMonth(current.getMonth() + 1)
  }

  const mesesAtrasoCount = parcelas.length
  const valorLiquidoFinal = Number((valorTotalCorrigido - valorDescontos).toFixed(2))

  let valorHonorarios: number | undefined
  let valorLiquidoCliente: number | undefined
  if (percentualHonorarios !== undefined) {
    if (percentualHonorarios < 0 || percentualHonorarios > 100) {
      throw new Error('O percentual de honorários deve estar entre 0 e 100.')
    }
    valorHonorarios = Number((valorLiquidoFinal * (percentualHonorarios / 100)).toFixed(2))
    valorLiquidoCliente = Number((valorLiquidoFinal - valorHonorarios).toFixed(2))
  }

  return {
    dataInicioDireito,
    dataRequerimento,
    mesesAtraso: mesesAtrasoCount,
    valorMensalBruto,
    valorTotalBruto: Number(valorTotalBruto.toFixed(2)),
    valorTotalCorrigido: Number(valorTotalCorrigido.toFixed(2)),
    indiceCorrecao: 'INPC (IBGE) Acumulado',
    valorDescontos,
    descricaoDescontos,
    valorLiquidoFinal,
    percentualHonorarios,
    valorHonorarios,
    valorLiquidoCliente,
    memoriaCalculo: {
      parcelas,
      // Evita divisão por zero: se valorTotalBruto for 0, o acumulado é 0
      acumuladoINPC: valorTotalBruto > 0
        ? Number(((valorTotalCorrigido / valorTotalBruto) - 1).toFixed(4))
        : 0
    }
  }
}
