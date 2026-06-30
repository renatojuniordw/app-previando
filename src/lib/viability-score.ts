/**
 * Engine de Score de Viabilidade (Determinístico)
 *
 * Calcula um score 0-100 combinando múltiplos fatores do caso,
 * sem depender de IA. Complementa o SuccessAnalysis (que é via OpenAI).
 */

import { calculatePrevidenciario } from '@/lib/previdencia-engine'
import { getRegisteredModalities } from '@/lib/strategies/registry'
import type { CnisExtractedData } from '@/services/cnis/types'
import type { CalculationResult } from '@/lib/previdencia-engine'

export interface ViabilityScoreInput {
  birthDate: string
  gender: 'M' | 'F'
  dib: string
  extractedData: CnisExtractedData | null
  salarioMinimo: number
  tetoPrevidenciario: number
}

export interface ViabilityScoreResult {
  score: number
  classificacao: 'ALTA' | 'MEDIA' | 'BAIXA' | 'INCONCLUSIVO'
  detalhamento: {
    elegibilidade: number   // 0-40
    tempoContribuicao: number // 0-20
    idade: number           // 0-15
    rmi: number             // 0-15
    consistenciaCnis: number // 0-10
  }
  modalidadesOrdenadas: Array<{
    modalidade: string
    score: number
    elegivel: boolean
    rmi: number
  }>
  recomendacao: string
}

// ─── Weights ─────────────────────────────────────────────────────────────

const WEIGHTS = {
  ELEGIBILIDADE: 40,
  TEMPO_CONTRIBUICAO: 20,
  IDADE: 15,
  RMI: 15,
  CONSISTENCIA_CNIS: 10,
}

// ─── Score calculation ───────────────────────────────────────────────────

export function calcularViabilityScore(input: ViabilityScoreInput): ViabilityScoreResult {
  const { birthDate, gender, dib, extractedData, salarioMinimo, tetoPrevidenciario } = input

  // 1. Testa todas as modalidades elegíveis
  const modalidades = getRegisteredModalities()
  const resultados: Array<{ modalidade: string; elegivel: boolean; rmi: number; score: number }> = []

  for (const modalidade of modalidades) {
    try {
      const result = calculatePrevidenciario({
        birthDate,
        gender,
        dib,
        modalidade,
        extractedData,
        salarioMinimo,
        tetoPrevidenciario,
      })
      resultados.push({
        modalidade,
        elegivel: result.elegivel,
        rmi: result.rmi,
        score: result.elegivel ? calcularScoreModalidade(result, modalidade) : 0,
      })
    } catch {
      // Modalidade não aplicável
      resultados.push({ modalidade, elegivel: false, rmi: 0, score: 0 })
    }
  }

  // 2. Calcula cada componente
  const elegiveis = resultados.filter((r) => r.elegivel)
  const scoreElegibilidade = Math.min(WEIGHTS.ELEGIBILIDADE, (elegiveis.length / Math.max(resultados.length, 1)) * WEIGHTS.ELEGIBILIDADE)

  // Tempo de contribuição — médio dos resultados elegíveis
  const scoreTempo = calcularScoreTempoContribuicao(extractedData, birthDate, dib)

  // Idade
  const scoreIdade = calcularScoreIdade(birthDate, dib, gender)

  // RMI vs SM
  const scoreRmi = elegiveis.length > 0
    ? Math.min(WEIGHTS.RMI, (elegiveis.reduce((acc, r) => acc + (r.rmi / salarioMinimo), 0) / elegiveis.length) * 5)
    : 0

  // Consistência do CNIS
  const scoreConsistencia = calcularScoreConsistencia(extractedData)

  // 3. Score total
  const score = Math.round(scoreElegibilidade + scoreTempo + scoreIdade + scoreRmi + scoreConsistencia)

  // 4. Classificação
  const classificacao = score >= 70 ? 'ALTA' : score >= 40 ? 'MEDIA' : score >= 10 ? 'BAIXA' : 'INCONCLUSIVO'

  // 5. Recomendação
  const recomendacao = gerarRecomendacao(classificacao, elegiveis.length, scoreTempo, scoreIdade)

  // 6. Modalidades ordenadas por score
  const modalidadesOrdenadas = resultados
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => ({ modalidade: r.modalidade, score: r.score, elegivel: r.elegivel, rmi: r.rmi }))

  return {
    score,
    classificacao,
    detalhamento: {
      elegibilidade: Math.round(scoreElegibilidade),
      tempoContribuicao: Math.round(scoreTempo),
      idade: Math.round(scoreIdade),
      rmi: Math.round(scoreRmi),
      consistenciaCnis: Math.round(scoreConsistencia),
    },
    modalidadesOrdenadas,
    recomendacao,
  }
}

function calcularScoreModalidade(result: CalculationResult, _modalidade: string): number {
  return result.rmi > 0 ? Math.min(100, (result.rmi / 5000) * 100) : 0
}

function calcularScoreTempoContribuicao(
  extractedData: CnisExtractedData | null,
  _birthDate: string,
  _dib: string
): number {
  if (!extractedData?.periodos?.length) return 0

  // Soma os meses de contribuição de todos os períodos
  const totalMeses = extractedData.periodos.reduce((acc, p) => {
    if (!p.inicio || !p.fim) return acc
    const inicio = new Date(p.inicio + '-02T12:00:00.000Z')
    const fim = new Date(p.fim + '-02T12:00:00.000Z')
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return acc
    const diff = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth())
    return acc + Math.max(0, diff)
  }, 0)

  const anosContribuicao = totalMeses / 12
  if (anosContribuicao >= 35) return WEIGHTS.TEMPO_CONTRIBUICAO // 20 pts
  if (anosContribuicao >= 25) return 15
  if (anosContribuicao >= 15) return 10
  if (anosContribuicao >= 10) return 5
  return Math.round((anosContribuicao / 15) * 10)
}

function calcularScoreIdade(birthDate: string, dib: string, gender: 'M' | 'F'): number {
  const birth = new Date(birthDate + 'T12:00:00.000Z')
  const ref = new Date(dib + 'T12:00:00.000Z')
  const idade = ref.getFullYear() - birth.getFullYear()
  const idadeMinima = gender === 'M' ? 65 : 62

  if (idade >= idadeMinima) return WEIGHTS.IDADE // 15 pts
  if (idade >= idadeMinima - 5) return 10
  if (idade >= idadeMinima - 10) return 5
  return Math.round(Math.max(0, (idade / idadeMinima) * 10))
}

function calcularScoreConsistencia(extractedData: CnisExtractedData | null): number {
  if (!extractedData?.periodos?.length) return 0

  const periodos = extractedData.periodos
  let score = 10

  // Penaliza por poucos vínculos
  if (periodos.length === 1) score -= 2

  // Detecta gaps entre períodos
  const sorted = [...periodos].sort((a, b) => (a.inicio ?? '').localeCompare(b.inicio ?? ''))
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    if (!prev.fim || !curr.inicio) continue
    const gap = new Date(curr.inicio + '-02T12:00:00.000Z').getTime() -
      new Date(prev.fim + '-02T12:00:00.000Z').getTime()
    if (gap > 365 * 2 * 24 * 60 * 60 * 1000) score -= 3 // gap > 2 anos
  }

  // Penaliza sem salários registrados
  const totalSalarios = periodos.reduce((acc, p) => acc + (p.salarios?.length || 0), 0)
  if (totalSalarios === 0) score -= 5

  return Math.max(0, score)
}

function gerarRecomendacao(
  classificacao: string,
  modalidadesElegiveis: number,
  scoreTempo: number,
  scoreIdade: number
): string {
  if (classificacao === 'ALTA') {
    return 'Alta probabilidade de êxito. Recomenda-se protocolar o requerimento administrativo o quanto antes.'
  }
  if (classificacao === 'MEDIA') {
    const recomendacoes: string[] = []
    if (scoreTempo < 15) recomendacoes.push('continuar contribuindo para aumentar o tempo de contribuição')
    if (scoreIdade < 10) recomendacoes.push('avaliar a possibilidade de aguardar até atingir a idade mínima')
    if (modalidadesElegiveis === 0) recomendacoes.push('buscar outras modalidades de benefício')
    return `Probabilidade mediana de êxito. Sugere-se ${recomendacoes.join(' e ')} antes de protocolar.`
  }
  if (classificacao === 'BAIXA') {
    return 'Baixa probabilidade de êxito no momento. Recomenda-se planejamento previdenciário para atingir os requisitos necessários.'
  }
  return 'Não foi possível determinar a viabilidade. Certifique-se de que o CNIS foi processado corretamente.'
}
