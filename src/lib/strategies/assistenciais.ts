/**
 * Estratégias de Cálculo para Modalidades Assistenciais e Benefícios
 * Implementa o padrão Strategy (GoF) para o Open/Closed Principle (OCP)
 */

import {
  CARENCIA_AUXILIO_DOENCA_MESES,
  CARENCIA_PENSAO_MORTE_MESES,
  COEFICIENTE_AUXILIO_DOENCA,
  COEFICIENTE_BASE,
  ACRESCIMO_ANUAL,
} from '@/lib/previdenciario-constants'
import type { ModalidadeStrategy, ModalidadeEvaluationInput, ModalidadeEvaluationResult } from './types'

// ─── Auxílio-Doença Previdenciário (B31) ─────────────────────────────────

export class AuxilioDoencaB31Strategy implements ModalidadeStrategy {
  readonly modalidade = 'AUXILIO_DOENCA_B31'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { carenciaMeses, regra } = input
    const carenciaExigida = regra?.carenciaMeses ?? CARENCIA_AUXILIO_DOENCA_MESES
    const coeficiente = COEFICIENTE_AUXILIO_DOENCA
    const pendencias: string[] = []

    const elegivel = carenciaMeses >= carenciaExigida

    if (!elegivel) {
      pendencias.push(`Carência mínima de ${carenciaExigida} contribuições para auxílio-doença previdenciário não cumprida (carência apurada: ${carenciaMeses}).`)
    }

    return { elegivel, coeficiente, pendencias }
  }
}

// ─── Auxílio-Doença Acidentário (B91) ────────────────────────────────────

export class AuxilioDoencaB91Strategy implements ModalidadeStrategy {
  readonly modalidade = 'AUXILIO_DOENCA_B91'

  evaluate(_input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    // Acidentário: não exige carência
    return {
      elegivel: true,
      coeficiente: COEFICIENTE_AUXILIO_DOENCA,
      pendencias: [],
    }
  }
}

// ─── Salário-Maternidade ─────────────────────────────────────────────────

export class SalarioMaternidadeStrategy implements ModalidadeStrategy {
  readonly modalidade = 'SALARIO_MATERNIDADE'

  evaluate(_input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    // Geralmente elegível com vínculo ativo
    return {
      elegivel: true,
      coeficiente: 1.0,
      pendencias: [],
    }
  }
}

// ─── Auxílio-Reclusão ────────────────────────────────────────────────────

export class AuxilioReclusaoStrategy implements ModalidadeStrategy {
  readonly modalidade = 'AUXILIO_RECLUSAO'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { salarioBeneficio, regra } = input
    const limiteBaixaRenda = regra?.idadeMinima ? Number(regra.idadeMinima) : 1800
    const pendencias: string[] = []

    const elegivel = salarioBeneficio <= limiteBaixaRenda

    if (!elegivel) {
      pendencias.push(`Renda mensal do segurado (R$ ${salarioBeneficio}) superior ao limite legal de R$ ${limiteBaixaRenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para auxílio-reclusão.`)
    }

    return { elegivel, coeficiente: 1.0, pendencias }
  }
}

// ─── Pensão por Morte ────────────────────────────────────────────────────

export class PensaoMorteStrategy implements ModalidadeStrategy {
  readonly modalidade = 'PENSAO_MORTE'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { carenciaMeses, dependentesPensao, regra } = input
    const carenciaExigida = regra?.carenciaMeses ?? CARENCIA_PENSAO_MORTE_MESES
    const pendencias: string[] = []

    const coeficiente = Math.min(1.0, 0.5 + dependentesPensao * 0.1)
    const elegivel = carenciaMeses >= carenciaExigida

    if (!elegivel) {
      pendencias.push(`Segurado possuía menos de ${carenciaExigida} contribuições, o que pode reduzir o prazo de pagamento da pensão ao cônjuge.`)
    }

    return { elegivel, coeficiente, pendencias }
  }
}

// ─── BPC/LOAS ────────────────────────────────────────────────────────────

export class BpcLoasStrategy implements ModalidadeStrategy {
  readonly modalidade = 'BPC_LOAS'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { idadeNaApuracao, regra } = input
    const idadeBPC = regra?.idadeMinima ?? 65
    const pendencias: string[] = []

    const elegivel = idadeNaApuracao >= idadeBPC

    if (!elegivel) {
      pendencias.push(`Idade mínima de ${idadeBPC} anos para BPC/LOAS Idoso não atingida (idade apurada: ${idadeNaApuracao} anos). Deficiência não avaliada.`)
    }

    return { elegivel, coeficiente: 1.0, pendencias }
  }
}
