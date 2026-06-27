import { prisma } from './prisma'
import { redis } from './redis'
import { PlanLimitError } from './api-error'
import type { PlanLimit, UsageRecord } from '@prisma/client'

const NEAR_LIMIT_THRESHOLD = 0.8

async function notifyLimitNear(userId: string, message: string): Promise<void> {
  // Deduplicar: máximo 1 notificação PLAN_LIMIT_NEAR por tipo por dia
  const today = new Date().toISOString().slice(0, 10)
  const dedupKey = `plan-limit-notif:${userId}:${today}`
  try {
    const already = await redis.get(dedupKey)
    if (already) return
    await redis.setex(dedupKey, 86400, '1')
  } catch {
    // Redis indisponível — envia sem deduplicação
  }

  await prisma.notification.create({
    data: { userId, type: 'PLAN_LIMIT_NEAR', message },
  }).catch(() => {
    // Notificação não crítica — não propaga erro
  })
}

export type PlanFeature =
  | 'SIMULATOR'
  | 'RETROATIVOS'
  | 'EXPORT_PDF'
  | 'WHATSAPP_SHARE'
  | 'DIAGNOSIS'
  | 'USE_BPC_MODULE'

const FEATURE_MAP: Record<PlanFeature, keyof PlanLimit> = {
  SIMULATOR: 'simulatorEnabled',
  RETROATIVOS: 'retroactiveEnabled',
  EXPORT_PDF: 'exportPdfEnabled',
  WHATSAPP_SHARE: 'whatsappEnabled',
  DIAGNOSIS: 'diagnosisEnabled',
  USE_BPC_MODULE: 'bpcEnabled',
}

const FEATURE_LABELS: Record<PlanFeature, string> = {
  SIMULATOR: 'Simulador de benefício',
  RETROATIVOS: 'Cálculo de retroativos',
  EXPORT_PDF: 'Exportar PDF',
  WHATSAPP_SHARE: 'Compartilhar via WhatsApp',
  DIAGNOSIS: 'Diagnóstico IA',
  USE_BPC_MODULE: 'Módulo BPC/LOAS',
}

const PLAN_LIMIT_TTL = 300 // 5 minutos

function planLimitCacheKey(plan: string) {
  return `plan-limit:${plan}`
}

export async function getPlanLimit(plan: string): Promise<PlanLimit> {
  const cacheKey = planLimitCacheKey(plan)

  try {
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as PlanLimit
  } catch {
    // Redis indisponível — consulta direta ao DB
  }

  const limit = await prisma.planLimit.findUnique({
    where: { plan: plan as import('@prisma/client').Plan },
  })
  if (!limit) throw new Error(`PlanLimit não encontrado para plano: ${plan}`)

  try {
    await redis.setex(cacheKey, PLAN_LIMIT_TTL, JSON.stringify(limit))
  } catch {
    // Ignorar falha ao cachear
  }

  return limit
}

export async function invalidatePlanLimitCache(plan: string): Promise<void> {
  try {
    await redis.del(planLimitCacheKey(plan))
  } catch {
    // Não crítico
  }
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

async function getOrResetUsageRecord(userId: string): Promise<UsageRecord | null> {
  const record = await prisma.usageRecord.findUnique({ where: { userId } })
  if (!record) return null

  const now = new Date()
  if (!isSameMonth(now, new Date(record.usageMonthRef))) {
    return prisma.usageRecord.update({
      where: { userId },
      data: {
        calculationsThisMonth: 0,
        opinionsThisMonth: 0,
        bpcAnalysesThisMonth: 0,
        bpcSocialMediaThisMonth: 0,
        usageMonthRef: now,
      },
    })
  }

  return record
}

export async function guardFeature(plan: string, feature: PlanFeature): Promise<void> {
  const limit = await getPlanLimit(plan)
  const field = FEATURE_MAP[feature]
  if (!limit[field]) {
    throw new PlanLimitError(
      `${FEATURE_LABELS[feature]} não está disponível no seu plano.`,
      feature,
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }
}

export async function guardClientLimit(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)
  if (limit.maxClients === -1) return

  const count = await prisma.client.count({ where: { userId } })
  if (count >= limit.maxClients) {
    throw new PlanLimitError(
      `Você atingiu o limite de ${limit.maxClients} clientes no plano ${plan}. Atualize para criar mais.`,
      'CLIENTS',
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }
}

export async function guardCalculationLimit(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)
  if (!limit.simulatorEnabled) {
    throw new PlanLimitError('Simulação não está disponível no seu plano.', 'CALCULATIONS', plan === 'FREE' ? 'SOLO' : 'PRO')
  }

  if (limit.maxCalculationsPerMonth === -1) return

  const record = await getOrResetUsageRecord(userId)
  const currentCount = record?.calculationsThisMonth ?? 0

  if (currentCount >= limit.maxCalculationsPerMonth) {
    throw new PlanLimitError(
      `Limite de ${limit.maxCalculationsPerMonth} simulações/mês atingido. Atualize seu plano ou aguarde o próximo mês.`,
      'CALCULATIONS',
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }

  if (
    limit.maxCalculationsPerMonth > 0 &&
    currentCount / limit.maxCalculationsPerMonth >= NEAR_LIMIT_THRESHOLD
  ) {
    notifyLimitNear(
      userId,
      `Você usou ${currentCount} de ${limit.maxCalculationsPerMonth} cálculos disponíveis neste mês.`
    )
  }
}

export async function guardOpinionLimit(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)
  if (!limit.diagnosisEnabled) {
    throw new PlanLimitError('Consulta de jurisprudência não está disponível no seu plano.', 'OPINIONS', plan === 'FREE' ? 'SOLO' : 'PRO')
  }

  if (limit.maxOpinionsPerMonth === -1) return

  const record = await getOrResetUsageRecord(userId)
  const currentCount = record?.opinionsThisMonth ?? 0

  if (currentCount >= limit.maxOpinionsPerMonth) {
    throw new PlanLimitError(
      `Limite de ${limit.maxOpinionsPerMonth} consultas/mês atingido. Atualize seu plano ou aguarde o próximo mês.`,
      'OPINIONS',
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }

  if (
    limit.maxOpinionsPerMonth > 0 &&
    currentCount / limit.maxOpinionsPerMonth >= NEAR_LIMIT_THRESHOLD
  ) {
    notifyLimitNear(
      userId,
      `Você usou ${currentCount} de ${limit.maxOpinionsPerMonth} pareceres IA disponíveis neste mês.`
    )
  }
}

export async function guardBpcAnalysisLimit(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)
  if (!limit.bpcEnabled) {
    throw new PlanLimitError('Análise BPC não está disponível no seu plano.', 'BPC_ANALYSIS', plan === 'FREE' ? 'SOLO' : 'PRO')
  }

  if (limit.bpcAnalysesPerMonth === -1) return

  const record = await getOrResetUsageRecord(userId)
  const currentCount = record?.bpcAnalysesThisMonth ?? 0

  if (currentCount >= limit.bpcAnalysesPerMonth) {
    throw new PlanLimitError(
      `Limite de ${limit.bpcAnalysesPerMonth} análises BPC/mês atingido. Atualize seu plano ou aguarde o próximo mês.`,
      'BPC_ANALYSIS',
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }
}

