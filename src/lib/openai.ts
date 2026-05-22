import OpenAI from 'openai'

let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? 'placeholder',
      timeout: 180_000, // Aumentado para 3 minutos para suportar extrações gigantescas (ex: 20+ páginas)
      maxRetries: 3,
    })
  }
  return _openai
}

// Keep backward compat — lazily initialized via getter
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as never)[prop as keyof OpenAI]
  },
})
