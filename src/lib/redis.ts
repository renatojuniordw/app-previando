import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

const REDIS_OPTIONS = {
  maxRetriesPerRequest: 1,
  connectTimeout: 2_000,
  enableReadyCheck: false,
  enableOfflineQueue: false,
  lazyConnect: true,
  retryStrategy: () => null,
}

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:60004', REDIS_OPTIONS)

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

/** Connection config for bullmq (avoids ioredis version conflicts between bullmq's bundled copy and the project's) */
export const bullmqConnection = {
  url: process.env.REDIS_URL || 'redis://localhost:60004',
  maxRetriesPerRequest: 1,
  connectTimeout: 2_000,
  enableReadyCheck: false,
  enableOfflineQueue: false,
  lazyConnect: true,
}
