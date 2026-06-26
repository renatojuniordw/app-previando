import OpenAI from 'openai'

let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? 'placeholder',
      timeout: 180_000,
      maxRetries: 3,
    })
  }
  return _openai
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as never)[prop as keyof OpenAI]
  },
})
