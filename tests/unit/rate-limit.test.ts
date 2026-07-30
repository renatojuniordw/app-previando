import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit with fallback (pipeline undefined)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses local fallback when Redis pipeline throws', async () => {
    const result = await rateLimit('fallback-key', 3, 60)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('local fallback enforces rate limit', async () => {
    await rateLimit('limited-key', 2, 60)
    await rateLimit('limited-key', 2, 60)
    const r3 = await rateLimit('limited-key', 2, 60)
    expect(r3.success).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it('local fallback returns correct structure', async () => {
    const result = await rateLimit('struct-key', 5, 30)
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('remaining')
    expect(result).toHaveProperty('reset')
  })

  it('local fallback uses different windows for different keys', async () => {
    await rateLimit('key-a', 2, 60)
    await rateLimit('key-a', 2, 60)
    await rateLimit('key-a', 2, 60)
    const rA = await rateLimit('key-a', 2, 60)
    expect(rA.success).toBe(false)
    const rB = await rateLimit('key-b', 2, 60)
    expect(rB.success).toBe(true)
  })
})
