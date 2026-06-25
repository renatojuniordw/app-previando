/**
 * Motor de Cálculo Previdenciário - Previando
 * Implementação das regras pós-Reforma da Previdência (EC 103/2019)
 */

export interface PeriodoCNIS {
  empregador: string
  inicio: string
  fim: string | null
  salarios: Array<{ competencia: string; valor: number }>
}

export interface CnisExtractedData {
  nit?: string
  nome?: string
  dataNascimento?: string
  totalContribuicoes?: number
  primeiraContribuicao?: string
  ultimaContribuicao?: string
  periodos?: PeriodoCNIS[]
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
  }
  periodosSalarios: {
    totalContribuicoes: number
    primeiraContribuicao: string
    ultimaContribuicao: string
  }
}

const SALARIO_MINIMO_FALLBACK = 1621.00
const TETO_PREVIDENCIARIO_FALLBACK = 8157.41

// Constantes previdenciárias EC 103/2019
const CARENCIA_APOSENTADORIA_MESES = 180       // Art. 27 Lei 8.213/91
const CARENCIA_AUXILIO_DOENCA_MESES = 12       // Art. 25, I
const CARENCIA_PENSAO_MORTE_MESES = 18         // Afeta duração, não elegibilidade

const COEFICIENTE_BASE = 0.60                  // Art. 26, EC 103/2019
const ACRESCIMO_ANUAL = 0.02                   // 2% por ano excedente
const ANOS_BASE_EXCEDENTE_M = 20               // Homens: acréscimo a partir de 20 anos
const ANOS_BASE_EXCEDENTE_F = 15               // Mulheres: acréscimo a partir de 15 anos

const MULTIPLICADOR_ESPECIAL_ACRESCIMO_M = 0.4 // Conversão tempo especial → comum (homem)
const MULTIPLICADOR_ESPECIAL_ACRESCIMO_F = 0.2 // Conversão tempo especial → comum (mulher)

const FATOR_PREVID_MIN = 0.4                   // Limite mínimo do fator previdenciário
const FATOR_PREVID_MAX = 1.2                   // Limite máximo do fator previdenciário
const DENOMINADOR_PEDAGIO_50 = 2200            // Denominador da fórmula do pedágio 50%

const COEFICIENTE_AUXILIO_DOENCA = 0.91        // Art. 61 Lei 8.213/91

const DATA_LIMITE_94 = new Date('1994-07-01')  // Início do Plano Real — base de cálculo pós-reforma

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
 * Roda o motor de cálculo para uma dada modalidade e CNIS
 */
export function calculatePrevidenciario(input: CalculationInput): CalculationResult {
  const { birthDate, gender, dib, modalidade, extractedData, tempoEspecialAnos = 0, dependentesPensao = 1, regrasVigentes } = input

  // Helper: busca a regra vigente para a modalidade/genero atual
  function regra(mod: string) {
    return regrasVigentes?.[`${mod}_${gender}`] ?? regrasVigentes?.[`${mod}_AMBOS`]
  }
  const SALARIO_MINIMO = input.salarioMinimo ?? SALARIO_MINIMO_FALLBACK
  const TETO_PREVIDENCIARIO = input.tetoPrevidenciario ?? TETO_PREVIDENCIARIO_FALLBACK

  const pendencias: string[] = []
  let elegivel = false

  // 1. Apuração de Idade e Dados Básicos
  const idadeNaApuracao = getAge(birthDate, dib)

  // 2. Extração de Contribuições e Apuração de Carência / Tempo
  let totalContribuicoesCount = 0
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

  // Ordena contribuições cronologicamente
  todasContribuicoes.sort((a, b) => a.competencia.localeCompare(b.competencia))
  totalContribuicoesCount = todasContribuicoes.length

  // Carência em meses (EC 103/2019: contribuição > 0 conta como válida para fins de carência)
  const carenciaMeses = todasContribuicoes.filter(c => c.valor > 0).length
  const carenciaAtendida = carenciaMeses >= CARENCIA_APOSENTADORIA_MESES

  // Tempo de contribuição total expresso em meses
  // Calculado a partir da soma dos meses de cada período
  let tempoContribuicaoMeses = 0
  if (extractedData?.periodos) {
    for (const p of extractedData.periodos) {
      const inicio = p.inicio
      const fim = p.fim || dib // Se o período está em aberto, assume até a DIB
      const meses = Math.max(1, diffInMonths(inicio, fim))
      tempoContribuicaoMeses += meses
    }
  }

  const tempoEspecialMeses = tempoEspecialAnos * 12
  const acrescimoEspecialMeses = tempoEspecialMeses * (gender === 'M' ? MULTIPLICADOR_ESPECIAL_ACRESCIMO_M : MULTIPLICADOR_ESPECIAL_ACRESCIMO_F)
  tempoContribuicaoMeses += Math.round(acrescimoEspecialMeses)

  const tempoContribuicaoAnos = Number((tempoContribuicaoMeses / 12).toFixed(1))

  // 3. Média dos Salários de Contribuição (Salário de Benefício - SB)
  // Regra pós-reforma: 100% de todas as contribuições desde julho/1994
  const dataLimite94 = new Date('1994-07-01')
  const contribuicoesApos94 = todasContribuicoes.filter(c => {
    const compDate = parseCompetenciaDate(c.competencia)
    return compDate !== null && compDate >= DATA_LIMITE_94
  })

  // Se não houver contribuições pós-94, usa todas as disponíveis
  const baseCalculo = contribuicoesApos94.length > 0 ? contribuicoesApos94 : todasContribuicoes

  const detalhamentoMedia = baseCalculo.map(c => {
    // Ajusta contribuições abaixo do mínimo da época para o salário mínimo atual de 2026 (ou mínimo proporcional)
    // Para simplificação visual premium, garantimos o piso atual do salário mínimo se o valor for menor
    let valorAjustado = c.valor
    if (valorAjustado < SALARIO_MINIMO && valorAjustado > 0) {
      valorAjustado = SALARIO_MINIMO
    }
    // Aplica teto da previdência
    if (valorAjustado > TETO_PREVIDENCIARIO) {
      valorAjustado = TETO_PREVIDENCIARIO
    }
    return {
      competencia: c.competencia,
      valorOriginal: c.valor,
      valorAjustado
    }
  })

  const somaSalarios = detalhamentoMedia.reduce((acc, curr) => acc + curr.valorAjustado, 0)
  const salarioBeneficio = detalhamentoMedia.length > 0 ? Number((somaSalarios / detalhamentoMedia.length).toFixed(2)) : SALARIO_MINIMO

  // 4. Coeficiente, RMI e Regras específicas de Elegibilidade
  let coeficiente = COEFICIENTE_BASE
  let fatorPrevidenciario = 1.00

  const anosExcedentes = gender === 'F'
    ? Math.max(0, tempoContribuicaoAnos - ANOS_BASE_EXCEDENTE_F)
    : Math.max(0, tempoContribuicaoAnos - ANOS_BASE_EXCEDENTE_M)
  const coeficienteProgressivo = COEFICIENTE_BASE + (anosExcedentes * ACRESCIMO_ANUAL)

  switch (modalidade) {
    case 'APOSENTADORIA_IDADE':
    case 'IDADE_MINIMA_65_62': {
      const r = regra(modalidade === 'APOSENTADORIA_IDADE' ? 'APOSENTADORIA_IDADE' : 'IDADE_MINIMA_65_62')
      const idadeMinima = r?.idadeMinima ?? (gender === 'M' ? 65 : 62)
      const tempoMinimoIdade = r?.tempoContribuicaoAnos ?? 15
      const carenciaExigida = r?.carenciaMeses ?? 180

      coeficiente = coeficienteProgressivo

      if (idadeNaApuracao >= idadeMinima && tempoContribuicaoAnos >= tempoMinimoIdade && carenciaMeses >= carenciaExigida) {
        elegivel = true
      } else {
        if (idadeNaApuracao < idadeMinima) pendencias.push(`Idade mínima de ${idadeMinima} anos não atingida (possui ${idadeNaApuracao}).`)
        if (tempoContribuicaoAnos < tempoMinimoIdade) pendencias.push(`Tempo de contribuição mínimo de ${tempoMinimoIdade} anos não atingido (possui ${tempoContribuicaoAnos}).`)
        if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida (possui ${carenciaMeses}).`)
      }
      break
    }

    case 'TEMPO_CONTRIBUICAO': {
      const r = regra('TEMPO_CONTRIBUICAO')
      const tempoMinimoTC = r?.tempoContribuicaoAnos ?? (gender === 'M' ? 35 : 30)
      const carenciaExigida = r?.carenciaMeses ?? 180
      coeficiente = coeficienteProgressivo

      if (tempoContribuicaoAnos >= tempoMinimoTC && carenciaMeses >= carenciaExigida) {
        elegivel = true
      } else {
        if (tempoContribuicaoAnos < tempoMinimoTC) pendencias.push(`Tempo de contribuição de ${tempoMinimoTC} anos não atingido (possui ${tempoContribuicaoAnos}).`)
        if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida (possui ${carenciaMeses}).`)
      }
      break
    }

    case 'PONTOS_86_96': {
      const r = regra('PONTOS_86_96')
      const tempoMinTCRegra = r?.tempoContribuicaoAnos ?? (gender === 'M' ? 35 : 30)
      const pontosExigidos  = r?.pontosMinimos          ?? (gender === 'M' ? 103 : 93)
      const carenciaExigida = r?.carenciaMeses          ?? 180
      const pontosAtuais = idadeNaApuracao + tempoContribuicaoAnos

      coeficiente = coeficienteProgressivo

      if (tempoContribuicaoAnos >= tempoMinTCRegra && pontosAtuais >= pontosExigidos && carenciaMeses >= carenciaExigida) {
        elegivel = true
      } else {
        if (tempoContribuicaoAnos < tempoMinTCRegra) pendencias.push(`Tempo de contribuição de ${tempoMinTCRegra} anos não atingido (possui ${tempoContribuicaoAnos}).`)
        if (pontosAtuais < pontosExigidos) pendencias.push(`Pontuação mínima de ${pontosExigidos} pontos não atingida (soma de idade e tempo deu ${pontosAtuais.toFixed(1)}).`)
        if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida (possui ${carenciaMeses}).`)
      }
      break
    }

    case 'PEDAGIO_50': {
      const r = regra('PEDAGIO_50')
      const tempoTC50 = r?.tempoContribuicaoAnos ?? (gender === 'M' ? 35 : 30)
      const carenciaExigida = r?.carenciaMeses ?? 180
      fatorPrevidenciario = Math.min(FATOR_PREVID_MAX, Math.max(FATOR_PREVID_MIN, (idadeNaApuracao * tempoContribuicaoAnos) / DENOMINADOR_PEDAGIO_50))
      coeficiente = fatorPrevidenciario

      if (tempoContribuicaoAnos >= tempoTC50 && carenciaMeses >= carenciaExigida) {
        elegivel = true
      } else {
        if (tempoContribuicaoAnos < tempoTC50) pendencias.push(`Tempo de contribuição de ${tempoTC50} anos não atingido para transição de 50%.`)
        if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida.`)
      }
      break
    }

    case 'PEDAGIO_100': {
      const r = regra('PEDAGIO_100')
      const idadePedagio100 = r?.idadeMinima           ?? (gender === 'M' ? 60 : 57)
      const tempoPedagio100 = r?.tempoContribuicaoAnos ?? (gender === 'M' ? 35 : 30)
      const carenciaExigida = r?.carenciaMeses         ?? 180
      coeficiente = 1.00

      if (idadeNaApuracao >= idadePedagio100 && tempoContribuicaoAnos >= tempoPedagio100 && carenciaMeses >= carenciaExigida) {
        elegivel = true
      } else {
        if (idadeNaApuracao < idadePedagio100) pendencias.push(`Idade mínima de ${idadePedagio100} anos não atingida para pedágio de 100% (possui ${idadeNaApuracao}).`)
        if (tempoContribuicaoAnos < tempoPedagio100) pendencias.push(`Tempo de contribuição de ${tempoPedagio100} anos não atingido para pedágio de 100% (possui ${tempoContribuicaoAnos}).`)
        if (carenciaMeses < carenciaExigida) pendencias.push(`Carência de ${carenciaExigida} contribuições mensais não cumprida.`)
      }
      break
    }

    case 'APOSENTADORIA_ESPECIAL': {
      const r = regra('APOSENTADORIA_ESPECIAL')
      const idadeEspecialMinima = r?.idadeMinima           ?? 60
      const tempoEspecialMinimo = r?.tempoContribuicaoAnos ?? 25
      coeficiente = coeficienteProgressivo

      if (idadeNaApuracao >= idadeEspecialMinima && tempoContribuicaoAnos >= tempoEspecialMinimo) {
        elegivel = true
      } else {
        if (idadeNaApuracao < idadeEspecialMinima) pendencias.push(`Idade mínima para especial de ${idadeEspecialMinima} anos não atingida (possui ${idadeNaApuracao}).`)
        if (tempoContribuicaoAnos < tempoEspecialMinimo) pendencias.push(`Tempo mínimo especial de ${tempoEspecialMinimo} anos não atingido (possui ${tempoContribuicaoAnos.toFixed(1)}).`)
      }
      break
    }

    case 'HIBRIDA': {
      const r = regra('HIBRIDA')
      const idadeHibrida  = r?.idadeMinima           ?? (gender === 'M' ? 65 : 62)
      const tempoHibrida  = r?.tempoContribuicaoAnos ?? 15
      coeficiente = COEFICIENTE_BASE + Math.max(0, tempoContribuicaoAnos - tempoHibrida) * ACRESCIMO_ANUAL

      if (idadeNaApuracao >= idadeHibrida && tempoContribuicaoAnos >= tempoHibrida) {
        elegivel = true
      } else {
        if (idadeNaApuracao < idadeHibrida) pendencias.push(`Idade mínima híbrida de ${idadeHibrida} anos não atingida (possui ${idadeNaApuracao}).`)
        if (tempoContribuicaoAnos < tempoHibrida) pendencias.push(`Tempo de contribuição mínimo de ${tempoHibrida} anos não atingido (possui ${tempoContribuicaoAnos}).`)
      }
      break
    }

    case 'AUXILIO_DOENCA_B31':
    case 'AUXILIO_DOENCA_B91': {
      const r = regra('AUXILIO_DOENCA_B31')
      const carenciaExigida = r?.carenciaMeses ?? CARENCIA_AUXILIO_DOENCA_MESES
      coeficiente = COEFICIENTE_AUXILIO_DOENCA
      elegivel = carenciaMeses >= carenciaExigida || modalidade === 'AUXILIO_DOENCA_B91'

      if (carenciaMeses < carenciaExigida && modalidade === 'AUXILIO_DOENCA_B31') {
        pendencias.push(`Carência mínima de ${carenciaExigida} contribuições para auxílio-doença previdenciário não cumprida (possui ${carenciaMeses}).`)
      }
      break
    }

    case 'SALARIO_MATERNIDADE':
      coeficiente = 1.00
      elegivel = true // Geralmente elegível com vínculo ativo
      break

    case 'AUXILIO_RECLUSAO': {
      coeficiente = 1.00
      // Limitado a 1 salário mínimo e baixa renda (limite parametrizável)
      const rRec = regra('AUXILIO_RECLUSAO')
      const limiteBaixaRenda = rRec?.idadeMinima ? Number(rRec.idadeMinima) : 1800
      elegivel = salarioBeneficio <= limiteBaixaRenda
      if (salarioBeneficio > limiteBaixaRenda) {
        pendencias.push(`Renda mensal do segurado (R$ ${salarioBeneficio}) superior ao limite legal de R$ ${limiteBaixaRenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para auxílio-reclusão.`)
      }
      break
    }

    case 'PENSAO_MORTE': {
      const r = regra('PENSAO_MORTE')
      const carenciaExigida = r?.carenciaMeses ?? CARENCIA_PENSAO_MORTE_MESES
      coeficiente = Math.min(1.00, 0.50 + (dependentesPensao * 0.10))
      elegivel = carenciaMeses >= carenciaExigida
      if (carenciaMeses < carenciaExigida) {
        pendencias.push(`Segurado possuía menos de ${carenciaExigida} contribuições, o que pode reduzir o prazo de pagamento da pensão ao cônjuge.`)
      }
      break
    }

    case 'BPC_LOAS': {
      const r = regra('BPC_LOAS')
      const idadeBPC = r?.idadeMinima ?? 65
      coeficiente = 1.00
      elegivel = idadeNaApuracao >= idadeBPC
      if (idadeNaApuracao < idadeBPC) {
        pendencias.push(`Idade mínima de ${idadeBPC} anos para BPC/LOAS Idoso não atingida (possui ${idadeNaApuracao}). Deficiência não avaliada.`)
      }
      break
    }

    default:
      coeficiente = COEFICIENTE_BASE
      elegivel = false
      pendencias.push(`Modalidade de cálculo ${modalidade} não parametrizada.`)
      break
  }

  // 5. Cálculo Final da RMI e RMA
  let rmi = Number((salarioBeneficio * coeficiente).toFixed(2))

  // Limites constitucionais (Piso do Salário Mínimo e Teto Previdenciário)
  // BPC sempre recebe exatamente 1 salário mínimo
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

  // RMA (Renda Mensal Atual): reajustada ou mantida na RMI para visualização inicial
  const rma = rmi

  // Primeira e última contribuição do CNIS para o painel
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
    fatorPrevidenciario: modalidade === 'PEDAGIO_50' ? Number(fatorPrevidenciario.toFixed(4)) : undefined,
    coeficiente: Number(coeficiente.toFixed(4)),
    dibPrevista: new Date(dib).toISOString(),
    carenciaAtendida,
    tempoContribuicao: tempoContribuicaoMeses,
    idadeNaApuracao,
    elegivel,
    pendencias,
    memoriaCalculo: {
      contribuicoesConsideradas: baseCalculo.length,
      somaSalarios,
      mediaSimples: salarioBeneficio,
      genero: gender === 'M' ? 'Masculino' : 'Feminino',
      tempoAnos: tempoContribuicaoAnos,
      idadeAnos: idadeNaApuracao,
      carenciaMeses,
      coeficienteAplicado: coeficiente,
      pisoNacional: SALARIO_MINIMO,
      tetoPrevidenciario: TETO_PREVIDENCIARIO,
      detalhamentoMedia: detalhamentoMedia.slice(0, 15),
      detalhamentoMediaTotalCount: detalhamentoMedia.length
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
  const { birthDate, gender, dibProjetada, valorContribuicaoFutura, extractedData, modalidade = 'APOSENTADORIA_IDADE', salarioMinimo, tetoPrevidenciario, regrasVigentes } = params

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
      // Pega a última competência cadastrada
      const salariosOrdenados = [...ultimoPeriodo.salarios].sort((a, b) => b.competencia.localeCompare(a.competencia))
      ultimaCompStr = salariosOrdenados[0].competencia
    }
  }

  if (ultimaCompStr) {
    const parts = ultimaCompStr.split('-')
    const ano = Number(parts[0])
    const mes = Number(parts[1])
    dataInicioProjecao = new Date(ano, mes, 1) // Inicia no mês seguinte
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
    // Incrementa 1 mês
    currentProj.setMonth(currentProj.getMonth() + 1)
  }

  if (salariosProjetados.length > 0) {
    clonedData.periodos.push({
      empregador: 'PROJEÇÃO DE CONTRIBUIÇÃO FUTURA (SIMULADO)',
      inicio: salariosProjetados[0].competencia + '-01',
      fim: salariosProjetados[salariosProjetados.length - 1].competencia + '-28',
      salarios: salariosProjetados
    })
  }

  // 4. Roda o motor previdenciário com o CNIS contendo as projeções
  const calcProjetado = calculatePrevidenciario({
    birthDate,
    gender,
    dib: dibProjetada,
    modalidade,
    extractedData: clonedData,
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
    salarioMinimo,
    tetoPrevidenciario,
    regrasVigentes,
  })

  const rmiProjected = calcProjetado.rmi
  const rmaProjected = calcProjetado.rma
  const gainVsNow = Math.max(0, Number((rmiProjected - calcHoje.rmi).toFixed(2)))

  return {
    scenarioParams: {
      valorContribuicaoFutura,
      competenciasSimuladas: salariosProjetados.length,
      dibProjetada,
      modalidade
    },
    rmiProjected,
    rmaProjected,
    dibProjected: new Date(dibProjetada).toISOString(),
    gainVsNow
  }
}
