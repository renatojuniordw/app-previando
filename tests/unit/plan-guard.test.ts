import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    planLimit: { findUnique: vi.fn() },
    usageRecord: { findUnique: vi.fn(), update: vi.fn(), upsert: vi.fn() },
    client: { count: vi.fn() },
    notification: { create: vi.fn() },
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

import {
  getPlanLimit,
  guardFeature,
  guardClientLimit,
  guardCalculationLimit,
  guardOpinionLimit,
  guardBpcAnalysisLimit,
} from '@/lib/plan-guard'

const mockPlanLimitFree = {
  plan: 'FREE',
  maxClients: 10,
  maxCalculationsPerMonth: 5,
  maxOpinionsPerMonth: 3,
  maxNotesPerCase: 10,
  bpcAnalysesPerMonth: 0,
  maxPeticoesPerMonth: 0,
  simulatorEnabled: false,
  retroactiveEnabled: false,
  exportPdfEnabled: true,
  watermarkEnabled: true,
  whatsappEnabled: false,
  diagnosisEnabled: false,
  bpcEnabled: false,
  peticaoEnabled: false,
}

const mockPlanLimitSolo = {
  ...mockPlanLimitFree,
  plan: 'SOLO',
  maxClients: 50,
  maxCalculationsPerMonth: -1,
  maxOpinionsPerMonth: 20,
  bpcAnalysesPerMonth: 10,
  simulatorEnabled: true,
  diagnosisEnabled: true,
  bpcEnabled: true,
}

const mockUsageRecord = {
  userId: 'user-1',
  calculationsThisMonth: 3,
  opinionsThisMonth: 2,
  bpcAnalysesThisMonth: 5,
  bpcSocialMediaThisMonth: 0,
  peticoesThisMonth: 0,
  usageMonthRef: new Date(),
}

describe('getPlanLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve buscar do banco quando cache esta vazio', async () => {
    vi.mocked(redis.get).mockResolvedValueOnce(null)
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(mockPlanLimitFree as any)

    const result = await getPlanLimit('FREE')
    expect(result.plan).toBe('FREE')
    expect(result.maxClients).toBe(10)
  })

  it('deve retornar do cache quando disponivel', async () => {
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(mockPlanLimitFree))

    const result = await getPlanLimit('FREE')
    expect(result.plan).toBe('FREE')
    expect(prisma.planLimit.findUnique).not.toHaveBeenCalled()
  })

  it('deve lancar erro quando plano nao encontrado', async () => {
    vi.mocked(redis.get).mockResolvedValueOnce(null)
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(null)

    await expect(getPlanLimit('INVALIDO')).rejects.toThrow('PlanLimit não encontrado para plano: INVALIDO')
  })
})

describe('guardFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValue(mockPlanLimitFree as any)
  })

  it('deve permitir feature habilitada', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce({ ...mockPlanLimitFree, exportPdfEnabled: true } as any)
    await expect(guardFeature('FREE', 'EXPORT_PDF')).resolves.toBeUndefined()
  })

  it('deve bloquear feature desabilitada', async () => {
    await expect(guardFeature('FREE', 'DIAGNOSIS')).rejects.toThrow('Diagnóstico IA não está disponível no seu plano.')
  })
})

describe('guardClientLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValue(mockPlanLimitFree as any)
  })

  it('deve permitir quando abaixo do limite', async () => {
    vi.mocked(prisma.client.count).mockResolvedValueOnce(5)
    await expect(guardClientLimit('user-1', 'FREE')).resolves.toBeUndefined()
  })

  it('deve bloquear quando no limite', async () => {
    vi.mocked(prisma.client.count).mockResolvedValueOnce(10)
    await expect(guardClientLimit('user-1', 'FREE')).rejects.toThrow('limite de 10 clientes')
  })

  it('deve permitir quando maxClients = -1 (ilimitado)', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce({ ...mockPlanLimitFree, maxClients: -1 } as any)
    await expect(guardClientLimit('user-1', 'PRO')).resolves.toBeUndefined()
    expect(prisma.client.count).not.toHaveBeenCalled()
  })
})

describe('guardCalculationLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValue(mockPlanLimitSolo as any)
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(mockUsageRecord as any)
  })

  it('deve permitir quando feature esta habilitada', async () => {
    await expect(guardCalculationLimit('user-1', 'SOLO')).resolves.toBeUndefined()
  })

  it('deve bloquear quando feature desabilitada', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(mockPlanLimitFree as any)
    await expect(guardCalculationLimit('user-1', 'FREE')).rejects.toThrow('não está disponível')
  })

  it('deve permitir quando maxCalculationsPerMonth = -1 (ilimitado)', async () => {
    await expect(guardCalculationLimit('user-1', 'SOLO')).resolves.toBeUndefined()
  })

  it('deve bloquear quando excede limite mensal', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce({ ...mockPlanLimitFree, simulatorEnabled: true } as any)
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValueOnce({ ...mockUsageRecord, calculationsThisMonth: 5 } as any)
    await expect(guardCalculationLimit('user-1', 'FREE')).rejects.toThrow('Limite de 5 simulações/mês')
  })
})

describe('guardOpinionLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValue(mockPlanLimitSolo as any)
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(mockUsageRecord as any)
  })

  it('deve permitir quando abaixo do limite', async () => {
    await expect(guardOpinionLimit('user-1', 'SOLO')).resolves.toBeUndefined()
  })

  it('deve bloquear quando excede limite', async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValueOnce({ ...mockUsageRecord, opinionsThisMonth: 20 } as any)
    await expect(guardOpinionLimit('user-1', 'SOLO')).rejects.toThrow('Limite de 20')
  })
})

describe('guardBpcAnalysisLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValue(mockPlanLimitSolo as any)
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(mockUsageRecord as any)
  })

  it('deve permitir quando abaixo do limite', async () => {
    await expect(guardBpcAnalysisLimit('user-1', 'SOLO')).resolves.toBeUndefined()
  })

  it('deve bloquear quando excede limite', async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValueOnce({ ...mockUsageRecord, bpcAnalysesThisMonth: 10 } as any)
    await expect(guardBpcAnalysisLimit('user-1', 'SOLO')).rejects.toThrow('Limite de 10')
  })

  it('deve bloquear quando feature desabilitada', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(mockPlanLimitFree as any)
    await expect(guardBpcAnalysisLimit('user-1', 'FREE')).rejects.toThrow('não está disponível')
  })
})
