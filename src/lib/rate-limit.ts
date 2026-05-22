import { redis } from './redis'

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
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
    // Redis indisponível — permite a request (fail open)
    return { success: true, remaining: limit, reset: now + windowMs }
  }
}
