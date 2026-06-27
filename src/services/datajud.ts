const DATAJUD_BASE = 'https://api-publica.datajud.cnj.jus.br'
// Chave pública do CNJ — não é segredo, usada por todos os integradores
const DATAJUD_API_KEY = 'cDZHYzlZa0JadVREZDJCendFbzNRdnp6Z3ZUcTdjMHJueFRuMnBiQVQ='

const STATE_TJ: Record<string, string> = {
  '01': 'tjac', '02': 'tjal', '03': 'tjam', '04': 'tjap', '05': 'tjba',
  '06': 'tjce', '07': 'tjdft', '08': 'tjes', '09': 'tjgo', '10': 'tjma',
  '11': 'tjmg', '12': 'tjms', '13': 'tjmt', '14': 'tjpa', '15': 'tjpb',
  '16': 'tjpe', '17': 'tjpi', '18': 'tjpr', '19': 'tjrj', '20': 'tjrn',
  '21': 'tjro', '22': 'tjrr', '23': 'tjrs', '24': 'tjsc', '25': 'tjse',
  '26': 'tjsp', '27': 'tjto',
}

export interface ProcessData {
  numeroProcesso: string
  tribunal: string
  classeProcessual?: string
  assuntos?: string[]
  dataAjuizamento?: string
  ultimaMovimentacao?: { data: string; descricao: string }
  totalMovimentacoes: number
  url?: string
}

export interface DatajudResult {
  found: boolean
  data?: ProcessData
  error?: string
}

function extractProcessParts(rawNumber: string): { justice: string; tribunal: string; normalized: string } | null {
  // Aceita NNNNNNN-DD.AAAA.J.TT.OOOO ou só os dígitos (20 chars)
  const digits = rawNumber.replace(/\D/g, '')
  if (digits.length !== 20) return null

  const justice = digits[14]
  const tribunal = digits.slice(15, 17)
  return { justice, tribunal, normalized: digits }
}

function getTribunalIndex(justice: string, tribunal: string): string | null {
  if (justice === '1') return 'api_publica_stf'
  if (justice === '3') return 'api_publica_stj'
  if (justice === '4') {
    const n = parseInt(tribunal, 10)
    if (n >= 1 && n <= 5) return `api_publica_trf${n}`
  }
  if (justice === '5') {
    const n = parseInt(tribunal, 10)
    if (n >= 1 && n <= 24) return `api_publica_trt${n}`
  }
  if (justice === '8') {
    const tj = STATE_TJ[tribunal]
    if (tj) return `api_publica_${tj}`
  }
  return null
}

export async function queryProcess(rawNumber: string): Promise<DatajudResult> {
  const parts = extractProcessParts(rawNumber)
  if (!parts) return { found: false, error: 'Número de processo inválido (esperado 20 dígitos no formato CNJ).' }

  const index = getTribunalIndex(parts.justice, parts.tribunal)
  if (!index) return { found: false, error: 'Tribunal não suportado pela API DataJud.' }

  let resp: Response
  try {
    resp = await fetch(`${DATAJUD_BASE}/${index}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${DATAJUD_API_KEY}`,
      },
      body: JSON.stringify({
        size: 1,
        query: { term: { 'numeroProcesso.keyword': parts.normalized } },
      }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch (err) {
    return { found: false, error: `Erro de rede ao consultar DataJud: ${(err as Error).message}` }
  }

  if (!resp.ok) {
    return { found: false, error: `DataJud retornou HTTP ${resp.status}` }
  }

  const json = await resp.json()
  const hit = json?.hits?.hits?.[0]?._source
  if (!hit) return { found: false }

  const movimentos: Array<{ dataHora: string; nome: string }> = hit.movimentos ?? []
  const sorted = [...movimentos].sort(
    (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
  )
  const latest = sorted[0]

  return {
    found: true,
    data: {
      numeroProcesso: hit.numeroProcesso ?? rawNumber,
      tribunal: hit.tribunal?.sigla ?? index.replace('api_publica_', '').toUpperCase(),
      classeProcessual: hit.classe?.nome,
      assuntos: (hit.assuntos ?? []).map((a: { nome: string }) => a.nome),
      dataAjuizamento: hit.dataAjuizamento,
      ultimaMovimentacao: latest
        ? { data: latest.dataHora, descricao: latest.nome }
        : undefined,
      totalMovimentacoes: movimentos.length,
      url: hit.url,
    },
  }
}
