import { loadEnvFile } from 'node:process'
import { vi } from 'vitest'

loadEnvFile('.env.test')

vi.mock('@/lib/prisma', () => ({
  prisma: {
    planLimit: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    usageRecord: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    client: {
      count: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    set: vi.fn(),
  },
}))
