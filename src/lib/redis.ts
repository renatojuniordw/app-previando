import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:60004', {
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy: () => null,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
