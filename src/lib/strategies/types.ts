/**
 * Tipos base para o Strategy Pattern de modalidades previdenciárias
 * Cada modalidade implementa sua própria lógica de elegibilidade e coeficiente
 */

export interface ModalidadeEvaluationInput {
  idadeNaApuracao: number
  tempoContribuicaoAnos: number
  carenciaMeses: number
  salarioBeneficio: number
  salarioMinimo: number
  tetoPrevidenciario: number
  gender: 'M' | 'F'
  dependentesPensao: number
  tempoEspecialAnos: number
  disabilityDegree?: 'LEVE' | 'MODERADO' | 'GRAVE'
  regra?: {
    idadeMinima?: number
    tempoContribuicaoAnos?: number
    pontosMinimos?: number
    carenciaMeses?: number
  }
}

export interface ModalidadeEvaluationResult {
  elegivel: boolean
  coeficiente: number
  fatorPrevidenciario?: number
  pendencias: string[]
}

export interface ModalidadeStrategy {
  readonly modalidade: string
  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult
}
