/**
 * Motor de Cálculo do Valor da Causa - Previando
 * Voltado a ações de BPC/LOAS: soma as parcelas vencidas corrigidas (DIB até o ajuizamento)
 * às parcelas vincendas (12 meses, no valor do salário mínimo vigente na data do ajuizamento).
 * Reaproveita o motor de retroativos para a correção monetária, evitando duplicar a lógica de INPC.
 */

import { calculateRetroativos, type RetroativoResult } from '@/lib/retroativos-engine'

export interface CauseValueInput {
  dataRequerimentoAdministrativo: string // YYYY-MM-DD
  dataAjuizamento: string                // YYYY-MM-DD
  dataInicioDireito: string              // YYYY-MM-DD (DIB)
  valorSalarioMinimoVigente: number
  indicesINPC: Record<string, number>
  numeroParcelasVincendas?: number
}

export interface CauseValueResult {
  dataRequerimentoAdministrativo: string
  dataAjuizamento: string
  dataInicioDireito: string
  mesesAtraso: number
  valorTotalCorrigido: number
  indiceCorrecao: string
  numeroParcelasVincendas: number
  valorParcelaVincenda: number
  valorTotalVincendas: number
  valorDaCausa: number
  memoriaCalculo: {
    retroativo: RetroativoResult['memoriaCalculo']
    salarioMinimoUtilizado: number
  }
}

export function calculateCauseValue(input: CauseValueInput): CauseValueResult {
  const {
    dataRequerimentoAdministrativo,
    dataAjuizamento,
    dataInicioDireito,
    valorSalarioMinimoVigente,
    indicesINPC,
    numeroParcelasVincendas = 12,
  } = input

  if (new Date(dataRequerimentoAdministrativo) > new Date(dataAjuizamento)) {
    throw new Error('A data do requerimento administrativo não pode ser posterior à data de ajuizamento.')
  }

  const retro = calculateRetroativos({
    dataInicioDireito,
    dataRequerimento: dataAjuizamento,
    valorMensalBruto: valorSalarioMinimoVigente,
    indicesINPC,
  })

  const valorTotalVincendas = Number((numeroParcelasVincendas * valorSalarioMinimoVigente).toFixed(2))
  const valorDaCausa = Number((retro.valorTotalCorrigido + valorTotalVincendas).toFixed(2))

  return {
    dataRequerimentoAdministrativo,
    dataAjuizamento,
    dataInicioDireito,
    mesesAtraso: retro.mesesAtraso,
    valorTotalCorrigido: retro.valorTotalCorrigido,
    indiceCorrecao: retro.indiceCorrecao,
    numeroParcelasVincendas,
    valorParcelaVincenda: valorSalarioMinimoVigente,
    valorTotalVincendas,
    valorDaCausa,
    memoriaCalculo: {
      retroativo: retro.memoriaCalculo,
      salarioMinimoUtilizado: valorSalarioMinimoVigente,
    },
  }
}
