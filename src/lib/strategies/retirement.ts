/**
 * Estratégias de Cálculo para Modalidades de Aposentadoria
 * Implementa o padrão Strategy (GoF) para o Open/Closed Principle (OCP)
 */

import {
  COEFICIENTE_BASE,
  ACRESCIMO_ANUAL,
  ANOS_BASE_EXCEDENTE_M,
  ANOS_BASE_EXCEDENTE_F,
  FATOR_PREVID_MIN,
  FATOR_PREVID_MAX,
  DENOMINADOR_PEDAGIO_50,
} from '@/lib/previdenciario-constants'
import type { ModalidadeStrategy, ModalidadeEvaluationInput, ModalidadeEvaluationResult } from './types'

function getAnosExcedentes(gender: 'M' | 'F', tempoContribuicaoAnos: number): number {
  const anosBase = gender === 'F' ? ANOS_BASE_EXCEDENTE_F : ANOS_BASE_EXCEDENTE_M
  return Math.max(0, tempoContribuicaoAnos - anosBase)
}

function getCoeficienteProgressivo(gender: 'M' | 'F', tempoContribuicaoAnos: number): number {
  const anosExcedentes = getAnosExcedentes(gender, tempoContribuicaoAnos)
  return COEFICIENTE_BASE + anosExcedentes * ACRESCIMO_ANUAL
}

// ─── Aposentadoria por Idade ─────────────────────────────────────────────

export class AposentadoriaIdadeStrategy implements ModalidadeStrategy {
  readonly modalidade = 'APOSENTADORIA_IDADE'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { idadeNaApuracao, tempoContribuicaoAnos, carenciaMeses, gender, regra } = input
    const idadeMinima = regra?.idadeMinima ?? (gender === 'M' ? 65 : 62)
    const tempoMinimoIdade = regra?.tempoContribuicaoAnos ?? 15
    const carenciaExigida = regra?.carenciaMeses ?? 180
    const coeficiente = getCoeficienteProgressivo(gender, tempoContribuicaoAnos)
    const pendencias: string[] = []

    const elegivel = idadeNaApuracao >= idadeMinima && tempoContribuicaoAnos >= tempoMinimoIdade && carenciaMeses >= carenciaExigida

    if (!elegivel) {
      if (idadeNaApuracao < idadeMinima) pendencias.push(`Idade mínima de ${idadeMinima} anos não atingida (idade apurada: ${idadeNaApuracao} anos).`)
      if (tempoContribuicaoAnos < tempoMinimoIdade) pendencias.push(`Tempo de contribuição mínimo de ${tempoMinimoIdade} anos não atingido (tempo apurado: ${tempoContribuicaoAnos} anos).`)
      if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida (carência apurada: ${carenciaMeses}).`)
    }

    return { elegivel, coeficiente, pendencias }
  }
}

// ─── Idade Mínima Progressiva ────────────────────────────────────────────

export class IdadeMinimaProgressivaStrategy implements ModalidadeStrategy {
  readonly modalidade = 'IDADE_MINIMA_65_62'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { idadeNaApuracao, tempoContribuicaoAnos, carenciaMeses, gender, regra } = input
    const idadeMinima = regra?.idadeMinima ?? (gender === 'M' ? 65 : 62)
    const tempoMinimoIdade = regra?.tempoContribuicaoAnos ?? 15
    const carenciaExigida = regra?.carenciaMeses ?? 180
    const coeficiente = getCoeficienteProgressivo(gender, tempoContribuicaoAnos)
    const pendencias: string[] = []

    const elegivel = idadeNaApuracao >= idadeMinima && tempoContribuicaoAnos >= tempoMinimoIdade && carenciaMeses >= carenciaExigida

    if (!elegivel) {
      if (idadeNaApuracao < idadeMinima) pendencias.push(`Idade mínima de ${idadeMinima} anos não atingida (idade apurada: ${idadeNaApuracao} anos).`)
      if (tempoContribuicaoAnos < tempoMinimoIdade) pendencias.push(`Tempo de contribuição mínimo de ${tempoMinimoIdade} anos não atingido (tempo apurado: ${tempoContribuicaoAnos} anos).`)
      if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida (carência apurada: ${carenciaMeses}).`)
    }

    return { elegivel, coeficiente, pendencias }
  }
}

// ─── Tempo de Contribuição ───────────────────────────────────────────────

export class TempoContribuicaoStrategy implements ModalidadeStrategy {
  readonly modalidade = 'TEMPO_CONTRIBUICAO'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { tempoContribuicaoAnos, carenciaMeses, gender, regra } = input
    const tempoMinimoTC = regra?.tempoContribuicaoAnos ?? (gender === 'M' ? 35 : 30)
    const carenciaExigida = regra?.carenciaMeses ?? 180
    const coeficiente = getCoeficienteProgressivo(gender, tempoContribuicaoAnos)
    const pendencias: string[] = []

    const elegivel = tempoContribuicaoAnos >= tempoMinimoTC && carenciaMeses >= carenciaExigida

    if (!elegivel) {
      if (tempoContribuicaoAnos < tempoMinimoTC) pendencias.push(`Tempo de contribuição de ${tempoMinimoTC} anos não atingido (tempo apurado: ${tempoContribuicaoAnos} anos).`)
      if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida (carência apurada: ${carenciaMeses}).`)
    }

    return { elegivel, coeficiente, pendencias }
  }
}

// ─── Pontos 86/96 ────────────────────────────────────────────────────────

export class PontosStrategy implements ModalidadeStrategy {
  readonly modalidade = 'PONTOS_86_96'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { tempoContribuicaoAnos, carenciaMeses, idadeNaApuracao, gender, regra } = input
    const tempoMinTCRegra = regra?.tempoContribuicaoAnos ?? (gender === 'M' ? 35 : 30)
    const pontosExigidos = regra?.pontosMinimos ?? (gender === 'M' ? 103 : 93)
    const carenciaExigida = regra?.carenciaMeses ?? 180
    const pontosAtuais = idadeNaApuracao + tempoContribuicaoAnos
    const coeficiente = getCoeficienteProgressivo(gender, tempoContribuicaoAnos)
    const pendencias: string[] = []

    const elegivel = tempoContribuicaoAnos >= tempoMinTCRegra && pontosAtuais >= pontosExigidos && carenciaMeses >= carenciaExigida

    if (!elegivel) {
      if (tempoContribuicaoAnos < tempoMinTCRegra) pendencias.push(`Tempo de contribuição de ${tempoMinTCRegra} anos não atingido (tempo apurado: ${tempoContribuicaoAnos} anos).`)
      if (pontosAtuais < pontosExigidos) pendencias.push(`Pontuação mínima de ${pontosExigidos} pontos não atingida (pontuação apurada: ${pontosAtuais.toFixed(1)} pontos).`)
      if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida (carência apurada: ${carenciaMeses}).`)
    }

    return { elegivel, coeficiente, pendencias }
  }
}

// ─── Pedágio 50% ─────────────────────────────────────────────────────────

export class Pedagio50Strategy implements ModalidadeStrategy {
  readonly modalidade = 'PEDAGIO_50'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { tempoContribuicaoAnos, carenciaMeses, idadeNaApuracao, gender, regra } = input
    const tempoTC50 = regra?.tempoContribuicaoAnos ?? (gender === 'M' ? 35 : 30)
    const carenciaExigida = regra?.carenciaMeses ?? 180
    const pendencias: string[] = []

    const fatorPrevidenciario = Math.min(FATOR_PREVID_MAX, Math.max(FATOR_PREVID_MIN, (idadeNaApuracao * tempoContribuicaoAnos) / DENOMINADOR_PEDAGIO_50))
    const coeficiente = fatorPrevidenciario

    const elegivel = tempoContribuicaoAnos >= tempoTC50 && carenciaMeses >= carenciaExigida

    if (!elegivel) {
      if (tempoContribuicaoAnos < tempoTC50) pendencias.push(`Tempo de contribuição de ${tempoTC50} anos não atingido para transição de 50%.`)
      if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida.`)
    }

    return { elegivel, coeficiente, fatorPrevidenciario, pendencias }
  }
}

// ─── Pedágio 100% ────────────────────────────────────────────────────────

export class Pedagio100Strategy implements ModalidadeStrategy {
  readonly modalidade = 'PEDAGIO_100'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { idadeNaApuracao, tempoContribuicaoAnos, carenciaMeses, gender, regra } = input
    const idadePedagio100 = regra?.idadeMinima ?? (gender === 'M' ? 60 : 57)
    const tempoPedagio100 = regra?.tempoContribuicaoAnos ?? (gender === 'M' ? 35 : 30)
    const carenciaExigida = regra?.carenciaMeses ?? 180
    const coeficiente = 1.0
    const pendencias: string[] = []

    const elegivel = idadeNaApuracao >= idadePedagio100 && tempoContribuicaoAnos >= tempoPedagio100 && carenciaMeses >= carenciaExigida

    if (!elegivel) {
      if (idadeNaApuracao < idadePedagio100) pendencias.push(`Idade mínima de ${idadePedagio100} anos não atingida para pedágio de 100% (idade apurada: ${idadeNaApuracao} anos).`)
      if (tempoContribuicaoAnos < tempoPedagio100) pendencias.push(`Tempo de contribuição de ${tempoPedagio100} anos não atingido para pedágio de 100% (tempo apurado: ${tempoContribuicaoAnos} anos).`)
      if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida.`)
    }

    return { elegivel, coeficiente, pendencias }
  }
}

// ─── Aposentadoria Especial ──────────────────────────────────────────────

export class AposentadoriaEspecialStrategy implements ModalidadeStrategy {
  readonly modalidade = 'APOSENTADORIA_ESPECIAL'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { idadeNaApuracao, tempoContribuicaoAnos, gender, regra } = input
    const idadeEspecialMinima = regra?.idadeMinima ?? 60
    const tempoEspecialMinimo = regra?.tempoContribuicaoAnos ?? 25
    const coeficiente = getCoeficienteProgressivo(gender, tempoContribuicaoAnos)
    const pendencias: string[] = []

    const elegivel = idadeNaApuracao >= idadeEspecialMinima && tempoContribuicaoAnos >= tempoEspecialMinimo

    if (!elegivel) {
      if (idadeNaApuracao < idadeEspecialMinima) pendencias.push(`Idade mínima para aposentadoria especial de ${idadeEspecialMinima} anos não atingida (idade apurada: ${idadeNaApuracao} anos).`)
      if (tempoContribuicaoAnos < tempoEspecialMinimo) pendencias.push(`Tempo mínimo especial de ${tempoEspecialMinimo} anos não atingido (tempo apurado: ${tempoContribuicaoAnos.toFixed(1)} anos).`)
    }

    return { elegivel, coeficiente, pendencias }
  }
}

// ─── Aposentadoria Híbrida ───────────────────────────────────────────────

export class HibridaStrategy implements ModalidadeStrategy {
  readonly modalidade = 'HIBRIDA'

  evaluate(input: ModalidadeEvaluationInput): ModalidadeEvaluationResult {
    const { idadeNaApuracao, tempoContribuicaoAnos, gender, regra } = input
    const idadeHibrida = regra?.idadeMinima ?? (gender === 'M' ? 65 : 62)
    const tempoHibrida = regra?.tempoContribuicaoAnos ?? 15
    const pendencias: string[] = []

    const coeficiente = COEFICIENTE_BASE + Math.max(0, tempoContribuicaoAnos - tempoHibrida) * ACRESCIMO_ANUAL
    const elegivel = idadeNaApuracao >= idadeHibrida && tempoContribuicaoAnos >= tempoHibrida

    if (!elegivel) {
      if (idadeNaApuracao < idadeHibrida) pendencias.push(`Idade mínima híbrida de ${idadeHibrida} anos não atingida (idade apurada: ${idadeNaApuracao} anos).`)
      if (tempoContribuicaoAnos < tempoHibrida) pendencias.push(`Tempo de contribuição mínimo de ${tempoHibrida} anos não atingido (tempo apurado: ${tempoContribuicaoAnos} anos).`)
    }

    return { elegivel, coeficiente, pendencias }
  }
}
