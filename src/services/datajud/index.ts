const DATAJUD_BASE = process.env.DATAJUD_BASE_URL ?? 'https://api-publica.datajud.cnj.jus.br'

export const CNJ_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/

export function isValidCNJ(numero: string): boolean {
  return CNJ_REGEX.test(numero.trim())
}

function extractTribunal(numeroProcesso: string): string {
  const parts = numeroProcesso.replace('-', '.').split('.')
  // parts: [NNNNNNN, DD, AAAA, J, TT, OOOO]
  const J = parts[3]
  const TT = parts[4]

  const TRIBUNAL_MAP: Record<string, string> = {
    '4.01': 'api_publica_trf1',
    '4.02': 'api_publica_trf2',
    '4.03': 'api_publica_trf3',
    '4.04': 'api_publica_trf4',
    '4.05': 'api_publica_trf5',
    '4.06': 'api_publica_trf6',
    '3.00': 'api_publica_stj',
    '1.00': 'api_publica_stf',
    '8.26': 'api_publica_tjsp',
    '8.19': 'api_publica_tjrj',
    '8.13': 'api_publica_tjmg',
  }

  return TRIBUNAL_MAP[`${J}.${TT}`] ?? `api_publica_trf${TT}`
}

export interface DatajudMovimentacao {
  dataHora: string
  nome: string
  complemento?: string
}

export interface DatajudResponse {
  numeroProcesso: string
  dataAjuizamento: string
  dataUltimaAtualizacao: string
  movimentos: DatajudMovimentacao[]
  totalMovimentos: number
}

export async function consultarProcesso(numeroProcesso: string): Promise<DatajudResponse> {
  const tribunal = extractTribunal(numeroProcesso)
  const endpoint = `${DATAJUD_BASE}/${tribunal}/_search`

  const body = {
    query: { match: { numeroProcesso } },
    sort: [{ dataHora: { order: 'desc' } }],
    size: 1,
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Datajud retornou erro ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const hit = data?.hits?.hits?.[0]?._source

  if (!hit) {
    throw new Error('Processo não encontrado no Datajud. Verifique o número CNJ.')
  }

  const movimentos: DatajudMovimentacao[] = ((hit.movimentos ?? []) as DatajudMovimentacao[])
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
    .slice(0, 20)

  return {
    numeroProcesso: hit.numeroProcesso,
    dataAjuizamento: hit.dataAjuizamento,
    dataUltimaAtualizacao: hit.dataUltimaAtualizacao,
    movimentos,
    totalMovimentos: (hit.movimentos ?? []).length,
  }
}
