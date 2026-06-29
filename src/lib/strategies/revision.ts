/**
 * Estratégias de Revisão de Benefícios
 *
 * Cada estratégia implementa um tipo diferente de revisão, estendendo
 * a interface ModalidadeStrategy para ser registrada no registry.
 */

import type { ModalidadeStrategy, ModalidadeEvaluationInput, ModalidadeEvaluationResult } from './types'

// ─── Revisão da Vida Toda (Tema 1.102/STF) ──────────────────────────────
// Inclui contribuições anteriores a julho/1994 no cálculo da média

export class RevisaoVidaTodaStrategy implements ModalidadeStrategy {
  readonly modalidade = 'REVISAO_VIDA_TODA'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const pendencias: string[] = []
    // A elegibilidade é definida pelo motor de revisão (revision-engine.ts)
    // A estratégia apenas retorna o coeficiente padrão
    return {
      elegivel: true,
      coeficiente: input.tempoContribuicaoAnos >= 15 ? 0.6 + Math.max(0, input.tempoContribuicaoAnos - 15) * 0.02 : 0.6,
      pendencias,
    }
  }
}

// ─── Revisão do Art. 29 (Tema 999/STJ) ──────────────────────────────────
// Exclui os 20% menores salários do cálculo

export class RevisaoArtigo29Strategy implements ModalidadeStrategy {
  readonly modalidade = 'REVISAO_ART_29'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const pendencias: string[] = []

    if (input.carenciaMeses < 180) {
      pendencias.push('Carência mínima de 180 contribuições não atingida.')
    }

    return {
      elegivel: pendencias.length === 0,
      coeficiente: 0.6 + Math.max(0, input.tempoContribuicaoAnos - 15) * 0.02,
      pendencias,
    }
  }
}

// ─── Revisão do Buraco Negro (EC 103/2019) ──────────────────────────────
// Corrige distorções pós-Reforma

export class RevisaoBuracoNegroStrategy implements ModalidadeStrategy {
  readonly modalidade = 'REVISAO_BURACO_NEGRO'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const pendencias: string[] = []

    return {
      elegivel: true,
      coeficiente: 0.6 + Math.max(0, input.tempoContribuicaoAnos - 15) * 0.02,
      pendencias,
    }
  }
}
