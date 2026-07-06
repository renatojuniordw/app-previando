/**
 * Estratégia de Revisão de Benefícios
 *
 * As teses específicas (Vida Toda/Tema 1.102/STF, Art. 29/Tema 999/STJ,
 * Buraco Negro/EC 103/2019) foram superadas/pacificadas pelo STF e removidas.
 * Mantém-se apenas uma estratégia genérica de recálculo do benefício.
 */

import type { ModalidadeStrategy, ModalidadeEvaluationInput, ModalidadeEvaluationResult } from './types'

export class RevisaoBeneficioStrategy implements ModalidadeStrategy {
  readonly modalidade = 'REVISAO_BENEFICIO'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    return {
      elegivel: true,
      coeficiente: 0.6 + Math.max(0, input.tempoContribuicaoAnos - 15) * 0.02,
      pendencias: [],
    }
  }
}
