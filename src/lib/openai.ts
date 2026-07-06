import OpenAI from 'openai'
import { Logger } from './logger'

const logger = new Logger('OpenAI')

let _openai: OpenAI | null = null

async function loggingFetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const start = Date.now()
  const method = init?.method ?? 'GET'
  const urlStr = typeof url === 'string' ? url : url.toString()
  const headers = init?.headers as Record<string, string> | undefined
  const retryCount = headers?.['x-stainless-retry-count']
  const attempt = retryCount ? ` (retry ${retryCount})` : ''

  logger.info(`→ ${method} ${urlStr}${attempt}`)

  try {
    const response = await fetch(url, init)
    const elapsed = Date.now() - start
    if (!response.ok) {
      logger.warn(`← ${response.status} ${urlStr}${attempt} em ${elapsed}ms`)
    } else {
      logger.info(`← ${response.status} ${urlStr}${attempt} em ${elapsed}ms`)
    }
    return response
  } catch (err) {
    logger.error(`✗ ${method} ${urlStr}${attempt} falhou após ${Date.now() - start}ms`, err)
    throw err
  }
}

export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada. Defina a variável de ambiente OPENAI_API_KEY para usar o serviço OpenAI.')
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 180_000,
      maxRetries: 3,
      fetch: loggingFetch,
    })
  }
  return _openai
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as never)[prop as keyof OpenAI]
  },
})
