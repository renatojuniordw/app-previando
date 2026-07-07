import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    planLimit: { findUnique: vi.fn() },
    usageRecord: { findUnique: vi.fn(), update: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    client: { count: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
    notification: { create: vi.fn().mockResolvedValue({}) },
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
  guardPeticaoLimit,
  guardRevisionLimit,
  tryConsumeMonthlyUsage,
  invalidatePlanLimitCache,
  reconcileClientActivation,
} from '@/lib/plan-guard'
import type { MonthlyUsageField } from '@/lib/plan-guard'

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
  revisionsThisMonth: 1,
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

  it('deve notificar quando proximo do limite (80%)', async () => {
    const planLimit = { ...mockPlanLimitFree, simulatorEnabled: true, maxCalculationsPerMonth: 5 }
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(planLimit as any)
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValueOnce({ ...mockUsageRecord, calculationsThisMonth: 4 } as any)
    await expect(guardCalculationLimit('user-1', 'FREE')).resolves.toBeUndefined()
    expect(prisma.notification.create).toHaveBeenCalled()
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

  it('deve notificar quando proximo do limite (80%)', async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValueOnce({ ...mockUsageRecord, opinionsThisMonth: 16 } as any)
    await expect(guardOpinionLimit('user-1', 'SOLO')).resolves.toBeUndefined()
    expect(prisma.notification.create).toHaveBeenCalled()
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

describe('guardPeticaoLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValue({
      ...mockPlanLimitSolo,
      peticaoEnabled: true,
      maxPeticoesPerMonth: 5,
    } as any)
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(mockUsageRecord as any)
  })

  it('deve permitir quando abaixo do limite', async () => {
    await expect(guardPeticaoLimit('user-1', 'SOLO')).resolves.toBeUndefined()
  })

  it('deve bloquear quando feature desabilitada', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(mockPlanLimitFree as any)
    await expect(guardPeticaoLimit('user-1', 'FREE')).rejects.toThrow('Petição Inicial')
  })

  it('deve bloquear quando excede limite', async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValueOnce({ ...mockUsageRecord, peticoesThisMonth: 5 } as any)
    await expect(guardPeticaoLimit('user-1', 'SOLO')).rejects.toThrow('Limite de 5')
  })

  it('deve permitir quando ilimitado', async () => {
    const unlimitedPlan = {
      ...mockPlanLimitSolo,
      peticaoEnabled: true,
      maxPeticoesPerMonth: -1,
    } as any
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(unlimitedPlan)
    await expect(guardPeticaoLimit('user-1', 'SOLO')).resolves.toBeUndefined()
  })

  it('deve notificar quando proximo do limite (80%)', async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValueOnce({ ...mockUsageRecord, peticoesThisMonth: 4 } as any)
    await expect(guardPeticaoLimit('user-1', 'SOLO')).resolves.toBeUndefined()
    expect(prisma.notification.create).toHaveBeenCalled()
  })
})

describe('guardRevisionLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValue({
      ...mockPlanLimitSolo,
      revisionEnabled: true,
      maxRevisionsPerMonth: 5,
    } as any)
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(mockUsageRecord as any)
  })

  it('deve permitir quando abaixo do limite', async () => {
    await expect(guardRevisionLimit('user-1', 'SOLO')).resolves.toBeUndefined()
  })

  it('deve bloquear quando feature desabilitada', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce({
      ...mockPlanLimitSolo,
      revisionEnabled: false,
    } as any)
    await expect(guardRevisionLimit('user-1', 'SOLO')).rejects.toThrow('Revisão de Benefícios')
  })

  it('deve bloquear quando excede limite', async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValueOnce({ ...mockUsageRecord, revisionsThisMonth: 5 } as any)
    await expect(guardRevisionLimit('user-1', 'SOLO')).rejects.toThrow('Limite de 5')
  })

  it('deve notificar quando proximo do limite (80%)', async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValueOnce({ ...mockUsageRecord, revisionsThisMonth: 4 } as any)
    await expect(guardRevisionLimit('user-1', 'SOLO')).resolves.toBeUndefined()
    expect(prisma.notification.create).toHaveBeenCalled()
  })
})

describe('tryConsumeMonthlyUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
  })

  it('incrementa quando há cota', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValue({ ...mockPlanLimitSolo, maxCalculationsPerMonth: 5 } as any)
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(mockUsageRecord as any)
    vi.mocked(prisma.usageRecord.upsert).mockResolvedValue({} as any)
    vi.mocked(prisma.usageRecord.updateMany).mockResolvedValue({ count: 1 } as any)
    const result = await tryConsumeMonthlyUsage('user-1', 'SOLO', 'calculationsThisMonth')
    expect(result).toBe(true)
  })

  it('retorna false quando cota esgotada', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValue({ ...mockPlanLimitFree, simulatorEnabled: true, maxCalculationsPerMonth: 5 } as any)
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(mockUsageRecord as any)
    vi.mocked(prisma.usageRecord.upsert).mockResolvedValue({} as any)
    vi.mocked(prisma.usageRecord.updateMany).mockResolvedValue({ count: 0 } as any)
    const result = await tryConsumeMonthlyUsage('user-1', 'FREE', 'calculationsThisMonth')
    expect(result).toBe(false)
  })

  it('incrementa sem limite quando ilimitado', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValue({ ...mockPlanLimitSolo, maxCalculationsPerMonth: -1 } as any)
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(mockUsageRecord as any)
    vi.mocked(prisma.usageRecord.upsert).mockResolvedValue({} as any)
    vi.mocked(prisma.usageRecord.update).mockResolvedValue({} as any)
    const result = await tryConsumeMonthlyUsage('user-1', 'SOLO', 'calculationsThisMonth')
    expect(result).toBe(true)
  })
})

describe('invalidatePlanLimitCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('remove cache do plano', async () => {
    await invalidatePlanLimitCache('FREE')
    expect(redis.del).toHaveBeenCalledWith('plan-limit:FREE')
  })
})

describe('guardFeature — todas as features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
  })

  it('bloqueia SIMULATOR no FREE', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(mockPlanLimitFree as any)
    await expect(guardFeature('FREE', 'SIMULATOR')).rejects.toThrow()
  })

  it('permite EXPORT_PDF no FREE', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(mockPlanLimitFree as any)
    await expect(guardFeature('FREE', 'EXPORT_PDF')).resolves.toBeUndefined()
  })

  it('permite SIMULATOR no SOLO', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(mockPlanLimitSolo as any)
    await expect(guardFeature('SOLO', 'SIMULATOR')).resolves.toBeUndefined()
  })
})

describe('reconcileClientActivation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any)
  })

  it('ativa todos quando maxClients = -1 (ilimitado)', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce({ ...mockPlanLimitFree, maxClients: -1 } as any)
    await reconcileClientActivation('user-1', 'FREE')
    expect(prisma.client.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', active: false },
      data: { active: true },
    })
  })

  it('ativa todos quando total <= maxClients', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(mockPlanLimitFree as any)
    vi.mocked(prisma.client.count).mockResolvedValueOnce(5)
    await reconcileClientActivation('user-1', 'FREE')
    expect(prisma.client.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', active: false },
      data: { active: true },
    })
  })

  it('desativa excedentes quando total > maxClients', async () => {
    vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(mockPlanLimitFree as any)
    vi.mocked(prisma.client.count).mockResolvedValueOnce(15)
    vi.mocked(prisma.client.findMany).mockResolvedValueOnce([
      { id: 'c1' }, { id: 'c2' }, { id: 'c3' }, { id: 'c4' }, { id: 'c5' },
      { id: 'c6' }, { id: 'c7' }, { id: 'c8' }, { id: 'c9' }, { id: 'c10' },
    ] as any)
    await reconcileClientActivation('user-1', 'FREE')
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})

describe('tryConsumeMonthlyUsage — todos os campos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redis.get).mockResolvedValue(null)
  })

  const fields: MonthlyUsageField[] = [
    'calculationsThisMonth',
    'opinionsThisMonth',
    'bpcAnalysesThisMonth',
    'peticoesThisMonth',
    'revisionsThisMonth',
  ]

  for (const field of fields) {
    it(`deve incrementar ${field} quando há cota`, async () => {
      const planLimit = {
        ...mockPlanLimitSolo,
        maxCalculationsPerMonth: 10,
        maxOpinionsPerMonth: 10,
        bpcAnalysesPerMonth: 10,
        maxPeticoesPerMonth: 10,
        maxRevisionsPerMonth: 10,
      }
      vi.mocked(prisma.planLimit.findUnique).mockResolvedValueOnce(planLimit as any)
      vi.mocked(prisma.usageRecord.findUnique).mockResolvedValueOnce(mockUsageRecord as any)
      vi.mocked(prisma.usageRecord.upsert).mockResolvedValueOnce({} as any)
      vi.mocked(prisma.usageRecord.updateMany).mockResolvedValueOnce({ count: 1 } as any)

      const result = await tryConsumeMonthlyUsage('user-1', 'SOLO', field)
      expect(result).toBe(true)
    })
  }
})
