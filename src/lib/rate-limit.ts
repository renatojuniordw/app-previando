import { randomUUID } from 'crypto'
import { LRUCache } from 'lru-cache'
import { redis } from './redis'

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

// In-memory fallback rate limiter (used when Redis is unavailable)
const localRateLimits = new LRUCache<string, { count: number; reset: number }>({
  max: 10000,
})

function localRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = localRateLimits.get(key)

  if (!existing) {
    const reset = now + windowMs
    localRateLimits.set(key, { count: 1, reset }, { ttl: windowMs })
    return { success: true, remaining: limit - 1, reset }
  }

  existing.count++
  return { success: existing.count <= limit, remaining: Math.max(0, limit - existing.count), reset: existing.reset }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  try {
    // Membro precisa ser único mesmo com duas requisições no mesmo milissegundo,
    // senão o sorted set as funde em uma única entrada e subconta o uso real.
    const member = `${now}:${randomUUID()}`

    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(redisKey, 0, now - windowMs)
    pipeline.zadd(redisKey, now, member)
    pipeline.zcard(redisKey)
    pipeline.expire(redisKey, windowSeconds)

    const results = await pipeline.exec()
    const count = (results?.[2]?.[1] as number) ?? 0

    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
      reset: now + windowMs,
    }
  } catch {
    // Redis indisponível — usa fallback local
    return localRateLimit(key, limit, windowMs)
  }
}
