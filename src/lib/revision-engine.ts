/**
 * Motor de Revisão de Benefícios
 *
 * Compara o benefício concedido com o benefício recalculado com base
 * nos dados atuais do CNIS, calculando diferenças e impacto retroativo.
 *
 * As teses específicas (Vida Toda/Tema 1.102/STF, Art. 29/Tema 999/STJ,
 * Buraco Negro/EC 103/2019) foram superadas/pacificadas pelo STF e removidas —
 * mantém-se apenas o recálculo genérico do benefício.
 */

import { calculatePrevidenciario } from './previdencia-engine'
import { FALLBACK_INPC_MENSAL } from './previdenciario-constants'
import type { RevisionInput, RevisionResult } from './strategies/revision-types'

/**
 * Calcula o valor retroativo aproximado de 5 anos (diferença mensal × 60 meses)
 */
function calcularRetroativo5Anos(diferencaMensal: number): number {
  // Aplica correção INPC aproximada para cada parcela
  let total = 0
  for (let i = 0; i < 60; i++) {
    total += diferencaMensal * Math.pow(1 + FALLBACK_INPC_MENSAL, i)
  }
  return Number(total.toFixed(2))
}

/**
 * Executa cálculo de revisão
 */
export function calcularRevisao(input: RevisionInput): RevisionResult {
  const { tipoRevisao, rmiConcedido, dibConcedido, birthDate, gender, extractedData, salarioMinimo, tetoPrevidenciario } = input
  const pendencias: string[] = []

  if (!extractedData?.periodos?.length) {
    pendencias.push('CNIS não processado ou sem contribuições.')
  }

  // Executa o cálculo revisado
  const resultado = calculatePrevidenciario({
    birthDate,
    gender,
    dib: dibConcedido,
    modalidade: 'REVISAO_BENEFICIO',
    extractedData,
    salarioMinimo,
    tetoPrevidenciario,
  })

  if (!resultado.elegivel) {
    pendencias.push(...resultado.pendencias)
  }

  const rmiRevisado = resultado.rmi
  const diferencaMensal = Math.max(0, Number((rmiRevisado - rmiConcedido).toFixed(2)))
  const diferencaPercentual = rmiConcedido > 0 ? Number(((rmiRevisado / rmiConcedido - 1) * 100).toFixed(2)) : 0

  // Calcula o SB original para comparar
  const { salarioBeneficio: sbOriginal } = calculatePrevidenciario({
    birthDate,
    gender,
    dib: dibConcedido,
    modalidade: 'APOSENTADORIA_IDADE',
    extractedData,
    salarioMinimo,
    tetoPrevidenciario,
  })

  const elegivel = diferencaMensal > 0 && pendencias.length === 0

  return {
    tipoRevisao,
    rmiConcedido,
    rmiRevisado,
    diferencaMensal,
    diferencaPercentual,
    retroativos5Anos: elegivel ? calcularRetroativo5Anos(diferencaMensal) : 0,
    elegivel,
    pendencias,
    memoriaCalculo: {
      salarioBeneficioOriginal: sbOriginal,
      salarioBeneficioRevisado: resultado.salarioBeneficio,
      coeficienteAplicado: resultado.coeficiente,
      contribuicoesConsideradasOriginal: resultado.memoriaCalculo.contribuicoesConsideradas,
      contribuicoesConsideradasRevisao: resultado.memoriaCalculo.contribuicoesConsideradas,
    },
  }
}
