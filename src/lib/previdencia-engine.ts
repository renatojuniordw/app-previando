/**
 * Motor de Cálculo Previdenciário - Previando
 * Implementação das regras pós-Reforma da Previdência (EC 103/2019)
 *
 * Refatorado para usar Strategy Pattern (OCP):
 * - Lógica de cada modalidade está em estrategias individuais
 * - Novas modalidades podem ser adicionadas sem modificar este arquivo
 */

import { getStrategy } from './strategies/registry'
import type { ModalidadeEvaluationInput } from './strategies/types'
import type { CnisExtractedData } from '@/services/cnis/types'

// Re-exporting for backward compatibility
export type { CnisExtractedData }

export interface PeriodoCNIS {
  empregador: string
  inicio: string
  fim: string | null
  salarios: Array<{ competencia: string; valor: number }>
}

// Regras vigentes na DIB — buscadas do banco pelo chamador via getRegrasVigentes()
// Chave: `${modalidade}_${genero}` (genero: 'M', 'F' ou 'AMBOS')
export type RegrasVigentes = Record<string, {
  idadeMinima?: number
  tempoContribuicaoAnos?: number
  pontosMinimos?: number
  carenciaMeses?: number
}>

export interface CalculationInput {
  birthDate: string
  gender: 'M' | 'F'
  dib: string
  modalidade: string
  extractedData: CnisExtractedData | null
  // Parâmetros extras
  tempoEspecialAnos?: number
  dependentesPensao?: number
  disabilityDegree?: 'LEVE' | 'MODERADO' | 'GRAVE'
  converterTempoComumPCD?: boolean
  // Valores vigentes na DIB (buscados do banco pelo chamador)
  salarioMinimo?: number
  tetoPrevidenciario?: number
  // Regras de elegibilidade vigentes na DIB (buscadas do banco pelo chamador)
  regrasVigentes?: RegrasVigentes
}

export interface CalculationResult {
  modalidade: string
  salarioBeneficio: number
  rmi: number
  rma: number
  fatorPrevidenciario?: number
  coeficiente: number
  dibPrevista: string
  carenciaAtendida: boolean
  tempoContribuicao: number // em meses
  idadeNaApuracao: number // em anos
  elegivel: boolean
  pendencias: string[]
  memoriaCalculo: {
    contribuicoesConsideradas: number
    somaSalarios: number
    mediaSimples: number
    genero: string
    tempoAnos: number
    idadeAnos: number
    carenciaMeses: number
    coeficienteAplicado: number
    pisoNacional: number
    tetoPrevidenciario: number
    detalhamentoMedia: Array<{ competencia: string; valorOriginal: number; valorAjustado: number }>
    detalhamentoMediaTotalCount: number
    viaElegibilidade?: 'IDADE' | 'TEMPO_CONTRIBUICAO' | 'AMBAS' | null
    converterTempoComumPCD?: boolean
    tempoContribuicaoRawAnos?: number
    tempoContribuicaoConvertidoAnos?: number
  }
  periodosSalarios: {
    totalContribuicoes: number
    primeiraContribuicao: string
    ultimaContribuicao: string
  }
}

import {
  SALARIO_MINIMO_FALLBACK,
  TETO_PREVIDENCIARIO_FALLBACK,
  CARENCIA_APOSENTADORIA_MESES,
  MULTIPLICADOR_ESPECIAL_ACRESCIMO_M,
  MULTIPLICADOR_ESPECIAL_ACRESCIMO_F,
  DATA_LIMITE_94,
} from '@/lib/previdenciario-constants'

function diffInMonths(startStr: string, endStr: string): number {
  const start = new Date(startStr)
  const end = new Date(endStr)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
  if (start > end) return 0
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
}

function parseCompetenciaDate(competencia: string): Date | null {
  if (!/^\d{4}-\d{2}$/.test(competencia)) return null
  const d = new Date(competencia + '-02')
  return isNaN(d.getTime()) ? null : d
}

/**
 * Calcula a idade em anos completos
 */
function getAge(birthDateStr: string, refDateStr: string): number {
  const birth = new Date(birthDateStr)
  const ref = new Date(refDateStr)
  let age = ref.getFullYear() - birth.getFullYear()
  const m = ref.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * Extrai contribuições do CNIS e ordena cronologicamente
 */
function extractContribuicoes(extractedData: CnisExtractedData | null): Array<{ competencia: string; valor: number }> {
  const todasContribuicoes: Array<{ competencia: string; valor: number }> = []

  if (extractedData?.periodos) {
    for (const p of extractedData.periodos) {
      if (p.salarios && p.salarios.length > 0) {
        for (const s of p.salarios) {
          todasContribuicoes.push({
            competencia: s.competencia,
            valor: Number(s.valor || 0)
          })
        }
      }
    }
  }

  todasContribuicoes.sort((a, b) => a.competencia.localeCompare(b.competencia))
  return todasContribuicoes
}

/**
 * Calcula o tempo de contribuição em meses a partir dos períodos do CNIS
 */
function calcularTempoContribuicao(extractedData: CnisExtractedData | null, dib: string, tempoEspecialAnos: number, gender: 'M' | 'F'): number {
  let tempoContribuicaoMeses = 0

  if (extractedData?.periodos) {
    for (const p of extractedData.periodos) {
      const inicio = p.inicio
      const fim = p.fim || dib
      const meses = Math.max(1, diffInMonths(inicio ?? dib, fim))
      tempoContribuicaoMeses += meses
    }
  }

  const tempoEspecialMeses = tempoEspecialAnos * 12
  const acrescimoEspecialMeses = tempoEspecialMeses * (gender === 'M' ? MULTIPLICADOR_ESPECIAL_ACRESCIMO_M : MULTIPLICADOR_ESPECIAL_ACRESCIMO_F)
  tempoContribuicaoMeses += Math.round(acrescimoEspecialMeses)

  return tempoContribuicaoMeses
}

/**
 * Calcula o salário de benefício (média das contribuições pós-94)
 */
function calcularSalarioBeneficio(
  todasContribuicoes: Array<{ competencia: string; valor: number }>,
  salarioMinimo: number,
  tetoPrevidenciario: number
): { salarioBeneficio: number; baseCalculo: Array<{ competencia: string; valorOriginal: number; valorAjustado: number }> } {
  const contribuicoesApos94 = todasContribuicoes.filter(c => {
    const compDate = parseCompetenciaDate(c.competencia)
    return compDate !== null && compDate >= DATA_LIMITE_94
  })

  const baseCalculo = contribuicoesApos94.length > 0 ? contribuicoesApos94 : todasContribuicoes

  const detalhamentoMedia = baseCalculo.map(c => {
    let valorAjustado = c.valor
    if (valorAjustado < salarioMinimo && valorAjustado > 0) {
      valorAjustado = salarioMinimo
    }
    if (valorAjustado > tetoPrevidenciario) {
      valorAjustado = tetoPrevidenciario
    }
    return {
      competencia: c.competencia,
      valorOriginal: c.valor,
      valorAjustado
    }
  })

  const somaSalarios = detalhamentoMedia.reduce((acc, curr) => acc + curr.valorAjustado, 0)
  const salarioBeneficio = detalhamentoMedia.length > 0 ? Number((somaSalarios / detalhamentoMedia.length).toFixed(2)) : salarioMinimo

  return { salarioBeneficio, baseCalculo: detalhamentoMedia }
}

/**
 * Roda o motor de cálculo para uma dada modalidade e CNIS
 * Agora delega a lógica específica de cada modalidade para as estratégias registradas.
 */
export function calculatePrevidenciario(input: CalculationInput): CalculationResult {
  const { birthDate, gender, dib, modalidade, extractedData, tempoEspecialAnos = 0, dependentesPensao = 1, disabilityDegree, converterTempoComumPCD, regrasVigentes } = input

  function regra(mod: string) {
    return regrasVigentes?.[`${mod}_${gender}`] ?? regrasVigentes?.[`${mod}_AMBOS`]
  }

  const SALARIO_MINIMO = input.salarioMinimo ?? SALARIO_MINIMO_FALLBACK
  const TETO_PREVIDENCIARIO = input.tetoPrevidenciario ?? TETO_PREVIDENCIARIO_FALLBACK

  // 1. Apuração de Idade e Dados Básicos
  const idadeNaApuracao = getAge(birthDate, dib)

  // 2. Extração de Contribuições e Apuração de Carência / Tempo
  const todasContribuicoes = extractContribuicoes(extractedData)
  const totalContribuicoesCount = todasContribuicoes.length

  // Carência em meses (EC 103/2019: contribuição > 0 conta como válida)
  const carenciaMeses = todasContribuicoes.filter(c => c.valor > 0).length
  const carenciaAtendida = carenciaMeses >= CARENCIA_APOSENTADORIA_MESES

  // Tempo de contribuição total expresso em meses
  const tempoContribuicaoMeses = calcularTempoContribuicao(extractedData, dib, tempoEspecialAnos, gender)
  const tempoContribuicaoAnos = Number((tempoContribuicaoMeses / 12).toFixed(1))

  // 3. Média dos Salários de Contribuição (Salário de Benefício - SB)
  const { salarioBeneficio, baseCalculo } = calcularSalarioBeneficio(todasContribuicoes, SALARIO_MINIMO, TETO_PREVIDENCIARIO)

  // 4. Delega para a Strategy específica da modalidade
  const strategy = getStrategy(modalidade)
  const strategyInput: ModalidadeEvaluationInput = {
    idadeNaApuracao,
    tempoContribuicaoAnos,
    carenciaMeses,
    salarioBeneficio,
    salarioMinimo: SALARIO_MINIMO,
    tetoPrevidenciario: TETO_PREVIDENCIARIO,
    gender,
    dependentesPensao,
    tempoEspecialAnos,
    disabilityDegree,
    converterTempoComumPCD,
    regra: regra(modalidade),
  }

  const strategyResult = strategy.evaluate(strategyInput)
  const { elegivel, coeficiente, fatorPrevidenciario, pendencias, viaElegibilidade, tempoContribuicaoRawAnos, tempoContribuicaoConvertidoAnos } = strategyResult

  // 5. Cálculo Final da RMI e RMA
  let rmi = Number((salarioBeneficio * coeficiente).toFixed(2))

  // Limites constitucionais (Piso do Salário Mínimo e Teto Previdenciário)
  if (modalidade === 'BPC_LOAS') {
    rmi = SALARIO_MINIMO
  } else {
    if (rmi < SALARIO_MINIMO) {
      rmi = SALARIO_MINIMO
    }
    if (rmi > TETO_PREVIDENCIARIO) {
      rmi = TETO_PREVIDENCIARIO
    }
  }

  const rma = rmi

  // Primeira e última contribuição do CNIS
  let primeiraContribuicao = 'N/A'
  let ultimaContribuicao = 'N/A'
  if (todasContribuicoes.length > 0) {
    primeiraContribuicao = todasContribuicoes[0].competencia
    ultimaContribuicao = todasContribuicoes[todasContribuicoes.length - 1].competencia
  }

  return {
    modalidade,
    salarioBeneficio,
    rmi,
    rma,
    fatorPrevidenciario: modalidade === 'PEDAGIO_50' ? Number((fatorPrevidenciario ?? 1).toFixed(4)) : undefined,
    coeficiente: Number(coeficiente.toFixed(4)),
    dibPrevista: new Date(dib).toISOString(),
    carenciaAtendida,
    tempoContribuicao: tempoContribuicaoMeses,
    idadeNaApuracao,
    elegivel,
    pendencias,
    memoriaCalculo: {
      contribuicoesConsideradas: baseCalculo.length,
      somaSalarios: baseCalculo.reduce((acc, curr) => acc + curr.valorAjustado, 0),
      mediaSimples: salarioBeneficio,
      genero: gender === 'M' ? 'Masculino' : 'Feminino',
      tempoAnos: tempoContribuicaoAnos,
      idadeAnos: idadeNaApuracao,
      carenciaMeses,
      coeficienteAplicado: coeficiente,
      pisoNacional: SALARIO_MINIMO,
      tetoPrevidenciario: TETO_PREVIDENCIARIO,
      detalhamentoMedia: baseCalculo.slice(0, 15),
      detalhamentoMediaTotalCount: baseCalculo.length,
      viaElegibilidade: modalidade === 'APOSENTADORIA_PCD' ? viaElegibilidade : undefined,
      converterTempoComumPCD: modalidade === 'APOSENTADORIA_PCD' ? converterTempoComumPCD : undefined,
      tempoContribuicaoRawAnos: modalidade === 'APOSENTADORIA_PCD' ? tempoContribuicaoRawAnos : undefined,
      tempoContribuicaoConvertidoAnos: modalidade === 'APOSENTADORIA_PCD' ? tempoContribuicaoConvertidoAnos : undefined,
    },
    periodosSalarios: {
      totalContribuicoes: totalContribuicoesCount,
      primeiraContribuicao,
      ultimaContribuicao
    }
  }
}

/**
 * Projeta as contribuições futuras de agora até a data futura pretendida
 * e calcula os ganhos comparados do cenário simulado
 */
export function projectSimulations(params: {
  birthDate: string
  gender: 'M' | 'F'
  dibProjetada: string
  valorContribuicaoFutura: number
  extractedData: CnisExtractedData | null
  modalidade?: string
  tempoEspecialAnos?: number
  salarioMinimo?: number
  tetoPrevidenciario?: number
  regrasVigentes?: RegrasVigentes
}): {
  scenarioParams: Record<string, unknown>
  rmiProjected: number
  rmaProjected: number
  dibProjected: string
  gainVsNow: number
} {
  const { birthDate, gender, dibProjetada, valorContribuicaoFutura, extractedData, modalidade = 'APOSENTADORIA_IDADE', tempoEspecialAnos = 0, salarioMinimo, tetoPrevidenciario, regrasVigentes } = params

  // 1. Clona o CNIS existente
  const clonedData: CnisExtractedData = extractedData
    ? JSON.parse(JSON.stringify(extractedData))
    : { periodos: [] }

  if (!clonedData.periodos) clonedData.periodos = []

  // 2. Determina a data do último salário cadastrado para iniciar a projeção
  let dataInicioProjecao = new Date()
  let ultimaCompStr = ''

  if (clonedData.periodos.length > 0) {
    let ultimoPeriodo = clonedData.periodos[0]
    for (const p of clonedData.periodos) {
      if (!p.fim) {
        ultimoPeriodo = p
        break
      }
    }

    if (ultimoPeriodo.salarios && ultimoPeriodo.salarios.length > 0) {
      const salariosOrdenados = [...ultimoPeriodo.salarios].sort((a, b) => b.competencia.localeCompare(a.competencia))
      ultimaCompStr = salariosOrdenados[0].competencia
    }
  }

  if (ultimaCompStr) {
    const parts = ultimaCompStr.split('-')
    const ano = Number(parts[0])
    const mes = Number(parts[1])
    dataInicioProjecao = new Date(ano, mes, 1)
  }

  const dataFimProjecao = new Date(dibProjetada)

  // 3. Cria um período simulado "Projeção Futura de Contribuição"
  const salariosProjetados: Array<{ competencia: string; valor: number }> = []

  const currentProj = new Date(dataInicioProjecao.getFullYear(), dataInicioProjecao.getMonth() + 1, 1)

  while (currentProj <= dataFimProjecao) {
    const compStr = `${currentProj.getFullYear()}-${String(currentProj.getMonth() + 1).padStart(2, '0')}`
    salariosProjetados.push({
      competencia: compStr,
      valor: valorContribuicaoFutura
    })
    currentProj.setMonth(currentProj.getMonth() + 1)
  }

  if (salariosProjetados.length > 0) {
    clonedData.periodos.push({
      empregador: 'PROJEÇÃO DE CONTRIBUIÇÃO FUTURA (SIMULADO)',
      inicio: salariosProjetados[0].competencia + '-01',
      fim: salariosProjetados[salariosProjetados.length - 1].competencia + '-28',
      salarios: salariosProjetados,
      gaps: [],
    })
  }

  // 4. Roda o motor previdenciário com o CNIS contendo as projeções
  const calcProjetado = calculatePrevidenciario({
    birthDate,
    gender,
    dib: dibProjetada,
    modalidade,
    extractedData: clonedData,
    tempoEspecialAnos,
    salarioMinimo,
    tetoPrevidenciario,
    regrasVigentes,
  })

  // 5. Roda o motor previdenciário do cenário ATUAL (hoje) para comparar ganho
  const calcHoje = calculatePrevidenciario({
    birthDate,
    gender,
    dib: new Date().toISOString().split('T')[0],
    modalidade,
    extractedData,
    tempoEspecialAnos,
    salarioMinimo,
    tetoPrevidenciario,
    regrasVigentes,
  })

  const rmiProjected = calcProjetado.rmi
  const rmaProjected = calcProjetado.rma
  const gainVsNow = Math.max(0, Number((rmiProjected - calcHoje.rmi).toFixed(2)))

  // Cálculo preciso da idade na DIB projetada
  const birth = new Date(birthDate)
  const ref = new Date(dibProjetada)
  let ageYears = 0
  let ageMonths = 0
  if (!isNaN(birth.getTime()) && !isNaN(ref.getTime())) {
    ageYears = ref.getFullYear() - birth.getFullYear()
    ageMonths = ref.getMonth() - birth.getMonth()
    if (ageMonths < 0 || (ageMonths === 0 && ref.getDate() < birth.getDate())) {
      ageYears--
      ageMonths = 12 + ageMonths
    }
    if (ref.getDate() < birth.getDate() && ageMonths > 0) {
      ageMonths--
    }
  }

  return {
    scenarioParams: {
      valorContribuicaoFutura,
      competenciasSimuladas: salariosProjetados.length,
      dibProjetada,
      modalidade,
      gender,
      tempoEspecialAnos,
      elegivel: calcProjetado.elegivel,
      pendencias: calcProjetado.pendencias,
      idadeNaApuracaoAnos: ageYears,
      idadeNaApuracaoMeses: ageMonths,
      tempoContribuicaoAnos: Number((calcProjetado.tempoContribuicao / 12).toFixed(1)),
    },
    rmiProjected,
    rmaProjected,
    dibProjected: new Date(dibProjetada).toISOString(),
    gainVsNow
  }
}
