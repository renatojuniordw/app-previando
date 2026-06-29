import { vi } from 'vitest'

// Mock Prisma globally
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

// Mock Redis globally
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    set: vi.fn(),
  },
}))

// Set default test env vars
process.env.SALARIO_MINIMO_API = 'https://api.example.com'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.OPENAI_API_KEY = 'sk-test'
process.env.MERCADOPAGO_ACCESS_TOKEN = 'test-token'
process.env.MERCADOPAGO_WEBHOOK_SECRET = 'test-secret'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.CPF_HASH_SALT = 'test-salt-for-unit-tests'
process.env.SMTP_HOST = 'localhost'
process.env.SMTP_PORT = '587'
process.env.SMTP_USER = 'test'
process.env.SMTP_PASS = 'test'
process.env.EMAIL_FROM = 'test@previando.com.br'
