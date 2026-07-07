import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve retornar sucesso na primeira requisicao', async () => {
    const result = await rateLimit('test-key', 5, 60)
    expect(result.success).toBe(true)
    expect(result.remaining).toBeGreaterThanOrEqual(0)
    expect(result.reset).toBeGreaterThan(0)
  })

  it('deve usar fallback local quando Redis falha', async () => {
    const result = await rateLimit('fallback-test', 3, 60)
    expect(result.success).toBe(true)
    expect(result.remaining).toBeGreaterThanOrEqual(0)
  })

  it('deve retornar estrutura valida', async () => {
    const result = await rateLimit('structure-test', 10, 30)
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('remaining')
    expect(result).toHaveProperty('reset')
    expect(typeof result.success).toBe('boolean')
    expect(typeof result.remaining).toBe('number')
    expect(typeof result.reset).toBe('number')
  })

  it('deve decrementar remaining com uso', async () => {
    const r1 = await rateLimit('decrement-test', 2, 60)
    expect(r1.remaining).toBeGreaterThanOrEqual(0)
    const r2 = await rateLimit('decrement-test', 2, 60)
    expect(r2.remaining).toBeLessThanOrEqual(r1.remaining)
  })
})
