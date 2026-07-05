import { describe, it, expect } from 'vitest'
import { AI_MODELS, AI_MAX_TOKENS, AI_COST_PER_TOKEN } from '@/lib/ai-models'

describe('AI_MODELS', () => {
  it('tem modelo CRITICAL', () => {
    expect(AI_MODELS.CRITICAL).toBe('gpt-4.1-mini')
  })

  it('tem modelo OPERATIONAL', () => {
    expect(AI_MODELS.OPERATIONAL).toBe('gpt-4.1-nano')
  })
})

describe('AI_MAX_TOKENS', () => {
  it('é 16384', () => {
    expect(AI_MAX_TOKENS).toBe(16384)
  })
})

describe('AI_COST_PER_TOKEN', () => {
  it('tem custo para gpt-4.1-mini', () => {
    expect(AI_COST_PER_TOKEN['gpt-4.1-mini']).toBe(0.0000008)
  })

  it('tem custo para gpt-4.1-nano', () => {
    expect(AI_COST_PER_TOKEN['gpt-4.1-nano']).toBe(0.0000002)
  })

  it('gpt-4.1-mini é mais caro que gpt-4.1-nano', () => {
    expect(AI_COST_PER_TOKEN['gpt-4.1-mini']).toBeGreaterThan(AI_COST_PER_TOKEN['gpt-4.1-nano'])
  })
})
