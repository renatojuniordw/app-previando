/**
 * Motor de Revisão de Benefícios
 *
 * Compara o benefício concedido com o benefício recalculado segundo
 * cada modalidade de revisão, calculando diferenças e impacto retroativo.
 */

import { calculatePrevidenciario } from './previdencia-engine'
import { DATA_LIMITE_94, FALLBACK_INPC_MENSAL } from './previdenciario-constants'
import type { RevisionInput, RevisionResult, RevisionType } from './strategies/revision-types'
import type { CnisExtractedData } from '@/services/cnis/types'

/**
 * Extrai contribuições anteriores a 07/1994 de um CNIS
 */
function extractContribuicoesPre94(extractedData: CnisExtractedData | null): Array<{ competencia: string; valor: number }> {
  const contribuicoes: Array<{ competencia: string; valor: number }> = []

  if (!extractedData?.periodos) return contribuicoes

  for (const p of extractedData.periodos) {
    if (!p.salarios) continue
    for (const s of p.salarios) {
      const compDate = parseCompetenciaDate(s.competencia)
      if (compDate && compDate < DATA_LIMITE_94) {
        contribuicoes.push({ competencia: s.competencia, valor: Number(s.valor || 0) })
      }
    }
  }

  contribuicoes.sort((a, b) => a.competencia.localeCompare(b.competencia))
  return contribuicoes
}

function parseCompetenciaDate(competencia: string): Date | null {
  if (!/^\d{4}-\d{2}$/.test(competencia)) return null
  const d = new Date(competencia + '-02')
  return isNaN(d.getTime()) ? null : d
}

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
 * Clona o CNIS e adiciona contribuições pré-94 para Revisão da Vida Toda
 */
function clonarCnisComPre94(extractedData: CnisExtractedData | null): CnisExtractedData | null {
  if (!extractedData) return null

  const pre94 = extractContribuicoesPre94(extractedData)
  if (pre94.length === 0) return extractedData

  return {
    periodos: [
      ...(pre94.length > 0 ? [{
        empregador: 'Contribuições anteriores a 07/1994',
        inicio: pre94[0].competencia + '-01',
        fim: '1994-06-30',
        salarios: pre94,
        gaps: [],
      }] : []),
      ...(extractedData?.periodos ?? []),
    ],
  }
}

/**
 * Executa cálculo de revisão
 */
export function calcularRevisao(input: RevisionInput): RevisionResult {
  const { tipoRevisao, rmiConcedido, dibConcedido, birthDate, gender, extractedData, salarioMinimo, tetoPrevidenciario } = input
  const pendencias: string[] = []

  let revisionModalidade: string
  let cnisRevisado = extractedData

  switch (tipoRevisao) {
    case 'REVISAO_VIDA_TODA': {
      revisionModalidade = 'REVISAO_VIDA_TODA'
      cnisRevisado = clonarCnisComPre94(extractedData)

      if (!extractedData || !extractContribuicoesPre94(extractedData).length) {
        pendencias.push('Nenhuma contribuição anterior a julho/1994 encontrada no CNIS.')
      }
      break
    }
    case 'REVISAO_ART_29': {
      revisionModalidade = 'REVISAO_ART_29'
      if (!extractedData?.periodos?.length) {
        pendencias.push('CNIS não processado ou sem contribuições.')
      }
      break
    }
    case 'REVISAO_BURACO_NEGRO': {
      revisionModalidade = 'REVISAO_BURACO_NEGRO'
      const dibDate = new Date(dibConcedido + 'T12:00:00.000Z')
      const reformaDate = new Date('2019-11-13T12:00:00.000Z')
      if (dibDate <= reformaDate) {
        pendencias.push('DIB anterior à EC 103/2019. Esta revisão aplica-se apenas a benefícios concedidos após a Reforma.')
      }
      break
    }
    default:
      return {
        tipoRevisao,
        rmiConcedido,
        rmiRevisado: 0,
        diferencaMensal: 0,
        diferencaPercentual: 0,
        retroativos5Anos: 0,
        elegivel: false,
        pendencias: ['Tipo de revisão não reconhecido.'],
        memoriaCalculo: {
          salarioBeneficioOriginal: 0,
          salarioBeneficioRevisado: 0,
          coeficienteAplicado: 0,
          contribuicoesConsideradasOriginal: 0,
          contribuicoesConsideradasRevisao: 0,
        },
      }
  }

  // Executa o cálculo revisado
  const resultado = calculatePrevidenciario({
    birthDate,
    gender,
    dib: dibConcedido,
    modalidade: revisionModalidade,
    extractedData: cnisRevisado,
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
