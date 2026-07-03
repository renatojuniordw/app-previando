/**
 * Parser de número de processo CNJ (Resolução CNJ nº 65/2008).
 *
 * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
 *
 * - J (1 dígito): Segmento do Poder Judiciário
 * - TR (2 dígitos): Identificador do Tribunal
 */

// ─── Segmentos da Justiça ────────────────────────────────────────────────

export const JUSTICE_SEGMENTS: Record<string, string> = {
  '1': 'STF',
  '2': 'CNJ',
  '3': 'STJ',
  '4': 'Justiça Federal',
  '5': 'Justiça do Trabalho',
  '6': 'Justiça Eleitoral',
  '7': 'Justiça Militar da União',
  '8': 'Justiça Estadual',
  '9': 'Justiça Militar Estadual',
}

// ─── Tribunais Estaduais (J=8) — mesma ordem vale para Eleitoral (J=6) ──
// Ordem alfabética dos estados + DF

const STATE_TJ_MAP: Record<string, { sigla: string; nome: string; uf: string }> = {
  '01': { sigla: 'TJAC', nome: 'Tribunal de Justiça do Acre', uf: 'AC' },
  '02': { sigla: 'TJAL', nome: 'Tribunal de Justiça de Alagoas', uf: 'AL' },
  '03': { sigla: 'TJAM', nome: 'Tribunal de Justiça do Amazonas', uf: 'AM' },
  '04': { sigla: 'TJAP', nome: 'Tribunal de Justiça do Amapá', uf: 'AP' },
  '05': { sigla: 'TJBA', nome: 'Tribunal de Justiça da Bahia', uf: 'BA' },
  '06': { sigla: 'TJCE', nome: 'Tribunal de Justiça do Ceará', uf: 'CE' },
  '07': { sigla: 'TJDFT', nome: 'Tribunal de Justiça do Distrito Federal e Territórios', uf: 'DF' },
  '08': { sigla: 'TJES', nome: 'Tribunal de Justiça do Espírito Santo', uf: 'ES' },
  '09': { sigla: 'TJGO', nome: 'Tribunal de Justiça de Goiás', uf: 'GO' },
  '10': { sigla: 'TJMA', nome: 'Tribunal de Justiça do Maranhão', uf: 'MA' },
  '11': { sigla: 'TJMG', nome: 'Tribunal de Justiça de Minas Gerais', uf: 'MG' },
  '12': { sigla: 'TJMS', nome: 'Tribunal de Justiça do Mato Grosso do Sul', uf: 'MS' },
  '13': { sigla: 'TJMT', nome: 'Tribunal de Justiça do Mato Grosso', uf: 'MT' },
  '14': { sigla: 'TJPA', nome: 'Tribunal de Justiça do Pará', uf: 'PA' },
  '15': { sigla: 'TJPB', nome: 'Tribunal de Justiça da Paraíba', uf: 'PB' },
  '16': { sigla: 'TJPR', nome: 'Tribunal de Justiça do Paraná', uf: 'PR' },
  '17': { sigla: 'TJPE', nome: 'Tribunal de Justiça de Pernambuco', uf: 'PE' },
  '18': { sigla: 'TJPI', nome: 'Tribunal de Justiça do Piauí', uf: 'PI' },
  '19': { sigla: 'TJRJ', nome: 'Tribunal de Justiça do Rio de Janeiro', uf: 'RJ' },
  '20': { sigla: 'TJRN', nome: 'Tribunal de Justiça do Rio Grande do Norte', uf: 'RN' },
  '21': { sigla: 'TJRS', nome: 'Tribunal de Justiça do Rio Grande do Sul', uf: 'RS' },
  '22': { sigla: 'TJRO', nome: 'Tribunal de Justiça de Rondônia', uf: 'RO' },
  '23': { sigla: 'TJRR', nome: 'Tribunal de Justiça de Roraima', uf: 'RR' },
  '24': { sigla: 'TJSC', nome: 'Tribunal de Justiça de Santa Catarina', uf: 'SC' },
  '25': { sigla: 'TJSE', nome: 'Tribunal de Justiça de Sergipe', uf: 'SE' },
  '26': { sigla: 'TJSP', nome: 'Tribunal de Justiça de São Paulo', uf: 'SP' },
  '27': { sigla: 'TJTO', nome: 'Tribunal de Justiça do Tocantins', uf: 'TO' },
}

// ─── Tribunais Regionais Federais (J=4) ──────────────────────────────────

const TRF_MAP: Record<string, { sigla: string; nome: string; regiao: string }> = {
  '01': { sigla: 'TRF1', nome: 'Tribunal Regional Federal da 1ª Região', regiao: 'DF, MG, GO, TO, MT, BA, PI, MA, PA, AP, AM, RR, RO, AC' },
  '02': { sigla: 'TRF2', nome: 'Tribunal Regional Federal da 2ª Região', regiao: 'RJ, ES' },
  '03': { sigla: 'TRF3', nome: 'Tribunal Regional Federal da 3ª Região', regiao: 'SP, MS' },
  '04': { sigla: 'TRF4', nome: 'Tribunal Regional Federal da 4ª Região', regiao: 'RS, SC, PR' },
  '05': { sigla: 'TRF5', nome: 'Tribunal Regional Federal da 5ª Região', regiao: 'PE, CE, RN, PB, SE, AL' },
  '06': { sigla: 'TRF6', nome: 'Tribunal Regional Federal da 6ª Região', regiao: 'MG' },
}

// ─── Tribunais Regionais do Trabalho (J=5) ────────────────────────────────

const TRT_MAP: Record<string, { sigla: string; nome: string; regiao: string }> = {
  '01': { sigla: 'TRT1', nome: 'Tribunal Regional do Trabalho da 1ª Região', regiao: 'RJ' },
  '02': { sigla: 'TRT2', nome: 'Tribunal Regional do Trabalho da 2ª Região', regiao: 'SP (Grande SP)' },
  '03': { sigla: 'TRT3', nome: 'Tribunal Regional do Trabalho da 3ª Região', regiao: 'MG' },
  '04': { sigla: 'TRT4', nome: 'Tribunal Regional do Trabalho da 4ª Região', regiao: 'RS' },
  '05': { sigla: 'TRT5', nome: 'Tribunal Regional do Trabalho da 5ª Região', regiao: 'BA' },
  '06': { sigla: 'TRT6', nome: 'Tribunal Regional do Trabalho da 6ª Região', regiao: 'PE' },
  '07': { sigla: 'TRT7', nome: 'Tribunal Regional do Trabalho da 7ª Região', regiao: 'CE' },
  '08': { sigla: 'TRT8', nome: 'Tribunal Regional do Trabalho da 8ª Região', regiao: 'PA, AP' },
  '09': { sigla: 'TRT9', nome: 'Tribunal Regional do Trabalho da 9ª Região', regiao: 'PR' },
  '10': { sigla: 'TRT10', nome: 'Tribunal Regional do Trabalho da 10ª Região', regiao: 'DF, TO' },
  '11': { sigla: 'TRT11', nome: 'Tribunal Regional do Trabalho da 11ª Região', regiao: 'AM, RR' },
  '12': { sigla: 'TRT12', nome: 'Tribunal Regional do Trabalho da 12ª Região', regiao: 'SC' },
  '13': { sigla: 'TRT13', nome: 'Tribunal Regional do Trabalho da 13ª Região', regiao: 'PB' },
  '14': { sigla: 'TRT14', nome: 'Tribunal Regional do Trabalho da 14ª Região', regiao: 'RO, AC' },
  '15': { sigla: 'TRT15', nome: 'Tribunal Regional do Trabalho da 15ª Região', regiao: 'SP (interior)' },
  '16': { sigla: 'TRT16', nome: 'Tribunal Regional do Trabalho da 16ª Região', regiao: 'MA' },
  '17': { sigla: 'TRT17', nome: 'Tribunal Regional do Trabalho da 17ª Região', regiao: 'ES' },
  '18': { sigla: 'TRT18', nome: 'Tribunal Regional do Trabalho da 18ª Região', regiao: 'GO' },
  '19': { sigla: 'TRT19', nome: 'Tribunal Regional do Trabalho da 19ª Região', regiao: 'AL' },
  '20': { sigla: 'TRT20', nome: 'Tribunal Regional do Trabalho da 20ª Região', regiao: 'SE' },
  '21': { sigla: 'TRT21', nome: 'Tribunal Regional do Trabalho da 21ª Região', regiao: 'RN' },
  '22': { sigla: 'TRT22', nome: 'Tribunal Regional do Trabalho da 22ª Região', regiao: 'PI' },
  '23': { sigla: 'TRT23', nome: 'Tribunal Regional do Trabalho da 23ª Região', regiao: 'MT' },
  '24': { sigla: 'TRT24', nome: 'Tribunal Regional do Trabalho da 24ª Região', regiao: 'MS' },
}

// ─── Interface de saída ──────────────────────────────────────────────────

export interface CnjProcessInfo {
  /** Número normalizado de 20 dígitos (sem formatação) */
  normalized: string
  /** Número formatado (NNNNNNN-DD.AAAA.J.TR.OOOO) */
  formatted: string
  /** Ano de ajuizamento */
  year: string
  /** Segmento da Justiça (4, 5, 6, 8, 9...) */
  justiceCode: string
  /** Nome do segmento (ex: "Justiça Estadual") */
  justiceName: string
  /** Código do tribunal (01-27) */
  tribunalCode: string
  /** Sigla do tribunal (ex: "TJSP", "TRF3", "TRT2") */
  tribunalSigla: string
  /** Nome completo do tribunal */
  tribunalName: string
  /** UF do tribunal (para J=8 e J=6), ou null */
  uf: string | null
}

// ─── Função principal ────────────────────────────────────────────────────

export function parseCnjNumber(raw: string): CnjProcessInfo | null {
  // Remove tudo que não é dígito
  const digits = raw.replace(/\D/g, '')

  // O número CNJ tem exatamente 20 dígitos no formato normalizado
  if (digits.length !== 20) return null

  const year = digits.slice(9, 13)
  const justiceCode = digits[13]
  const tribunalCode = digits.slice(14, 16)

  const justiceName = JUSTICE_SEGMENTS[justiceCode] ?? 'Desconhecido'

  // Determinar tribunal com base no segmento
  let sigla: string
  let nome: string
  let uf: string | null

  if (justiceCode === '8') {
    // Justiça Estadual → TJ + estado
    const tj = STATE_TJ_MAP[tribunalCode]
    if (!tj) return null
    sigla = tj.sigla
    nome = tj.nome
    uf = tj.uf
  } else if (justiceCode === '6') {
    // Justiça Eleitoral → TRE + estado (mesma numeração dos TJs)
    const tj = STATE_TJ_MAP[tribunalCode]
    if (!tj) return null
    sigla = `TRE-${tj.uf}`
    nome = `Tribunal Regional Eleitoral do ${tj.uf}`
    uf = tj.uf
  } else if (justiceCode === '4') {
    // Justiça Federal → TRF + região
    const trf = TRF_MAP[tribunalCode]
    if (!trf) return null
    sigla = trf.sigla
    nome = trf.nome
    uf = null
  } else if (justiceCode === '5') {
    // Justiça do Trabalho → TRT + região
    const trt = TRT_MAP[tribunalCode]
    if (!trt) return null
    sigla = trt.sigla
    nome = trt.nome
    uf = null
  } else if (justiceCode === '7') {
    // Justiça Militar da União
    sigla = 'STM'
    nome = 'Superior Tribunal Militar'
    uf = null
  } else if (justiceCode === '9') {
    // Justiça Militar Estadual — só existe em MG (13), RS (21), SP (26)
    const tj = STATE_TJ_MAP[tribunalCode]
    if (!tj || !['13', '21', '26'].includes(tribunalCode)) return null
    sigla = `TJME-${tj.uf}`
    nome = `Tribunal de Justiça Militar do ${tj.uf}`
    uf = tj.uf
  } else {
    // Tribunais superiores (STF=1, CNJ=2, STJ=3) — sem tribunal regional
    sigla = justiceName
    nome = justiceName
    uf = null
  }

  // Reformatar para o padrão NNNNNNN-DD.AAAA.J.TR.OOOO
  const formatted = `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits[13]}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`

  return {
    normalized: digits,
    formatted,
    year,
    justiceCode,
    justiceName,
    tribunalCode,
    tribunalSigla: sigla,
    tribunalName: nome,
    uf,
  }
}

/**
 * Gera um identificador de tribunal a partir do número CNJ.
 * Ex: "TJSP", "TRF3", "TRT2", "TRE-SP"
 */
export function getTribunalId(raw: string): string | null {
  const info = parseCnjNumber(raw)
  if (!info) return null
  return info.tribunalSigla
}
