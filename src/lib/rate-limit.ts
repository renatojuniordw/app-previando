import { redis } from './redis'

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

// In-memory fallback rate limiter (used when Redis is unavailable)
const localRateLimits = new Map<string, { count: number; reset: number }>()

function localRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = localRateLimits.get(key)

  if (!existing || now > existing.reset) {
    localRateLimits.set(key, { count: 1, reset: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  existing.count++
  return { success: existing.count <= limit, remaining: Math.max(0, limit - existing.count), reset: existing.reset }
}

// Periodically clean expired entries from local rate limiter
setInterval(() => {
  const now = Date.now()
  localRateLimits.forEach((val, key) => {
    if (now > val.reset) localRateLimits.delete(key)
  })
}, 60000)

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  try {
    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(redisKey, 0, now - windowMs)
    pipeline.zadd(redisKey, now, `${now}`)
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
