import { Logger } from '@/lib/logger'

const logger = new Logger('TrackJudService')

// ─── Interface pública (DIP) ──────────────────────────────────────────────

export interface RegisterProcessOptions {
  /** Número do processo no formato CNJ (com ou sem formatação) */
  processNumber: string
  /** Sigla do tribunal identificada (ex: TJSP, TRF3, TRT2) — evita consultas desnecessárias */
  tribunal?: string
}

export interface IProcessMonitor {
  registerProcess(processNumberOrOptions: string | RegisterProcessOptions): Promise<{ monitorId: string }>
  unregisterProcess(monitorId: string): Promise<void>
  getProcess(monitorId: string): Promise<ProcessSnapshot | null>
}

export interface ProcessSnapshot {
  processNumber: string
  tribunal: string
  classeProcessual?: string
  assuntos?: string[]
  dataAjuizamento?: string
  ultimaMovimentacao?: { data: string; descricao: string }
  totalMovimentacoes: number
  urlExterno?: string
}

export interface TrackJudWebhookPayload {
  monitorId: string
  processNumber: string
  event: 'movement' | 'update'
  movements: Array<{
    date: string
    description: string
    code?: string
  }>
  totalMovements: number
  timestamp: string
}

// ─── TrackJud HTTP Client ─────────────────────────────────────────────────

class TrackJudHttpError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'TrackJudHttpError'
    this.status = status
  }
}

function getBaseUrl(): string {
  return process.env.TRACKJUD_BASE_URL || 'https://api.trackjud.com.br'
}

function getApiKey(): string {
  const key = process.env.TRACKJUD_API_KEY
  if (!key) throw new Error('TRACKJUD_API_KEY não configurada')
  return key
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${getBaseUrl()}${path}`

  const resp = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new TrackJudHttpError(
      `TrackJud HTTP ${resp.status}: ${text || resp.statusText}`,
      resp.status
    )
  }

  return resp.json() as Promise<T>
}

// ─── Implementação concreta ───────────────────────────────────────────────

export class TrackJudService implements IProcessMonitor {
  async registerProcess(processNumberOrOptions: string | RegisterProcessOptions): Promise<{ monitorId: string }> {
    const opts: RegisterProcessOptions = typeof processNumberOrOptions === 'string'
      ? { processNumber: processNumberOrOptions }
      : processNumberOrOptions

    const { processNumber, tribunal } = opts
    const logCtx = tribunal ? `${processNumber} (tribunal: ${tribunal})` : processNumber

    logger.info(`Registrando processo ${logCtx} no TrackJud`)

    const body: Record<string, unknown> = { processNumber }
    if (tribunal) {
      body.tribunal = tribunal
    }

    const result = await request<{ monitorId: string }>('POST', '/monitors', body)
    logger.info(`Processo ${logCtx} registrado: monitorId=${result.monitorId}`)
    return result
  }

  async unregisterProcess(monitorId: string): Promise<void> {
    logger.info(`Cancelando monitoramento ${monitorId} no TrackJud`)
    await request<void>('DELETE', `/monitors/${monitorId}`)
    logger.info(`Monitoramento ${monitorId} cancelado`)
  }

  async getProcess(monitorId: string): Promise<ProcessSnapshot | null> {
    logger.info(`Consultando snapshot do monitor ${monitorId}`)
    try {
      const result = await request<ProcessSnapshot>(
        'GET',
        `/monitors/${monitorId}/snapshot`
      )
      return result
    } catch (err) {
      if (err instanceof TrackJudHttpError && err.status === 404) {
        return null
      }
      throw err
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────

export const trackjud = new TrackJudService()
