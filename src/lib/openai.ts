import OpenAI from 'openai'

let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const provider = process.env.AI_PROVIDER ?? 'openai'
    const isVerboo = provider === 'verboo'

    _openai = new OpenAI({
      apiKey: isVerboo
        ? (process.env.VERBOO_API_KEY ?? 'placeholder')
        : (process.env.OPENAI_API_KEY ?? 'placeholder'),
      baseURL: isVerboo ? 'https://code.verboo.ai/router/v1' : undefined,
      timeout: 180_000,
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
