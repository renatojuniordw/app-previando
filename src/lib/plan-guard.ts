import { prisma } from './prisma'
import { redis } from './redis'
import { PlanLimitError } from './api-error'
import { Logger } from './logger'
import type { PlanLimit, UsageRecord, Prisma } from '@prisma/client'

const logger = new Logger('PlanGuard')

const NEAR_LIMIT_THRESHOLD = 0.8

async function notifyLimitNear(userId: string, feature: string, message: string): Promise<void> {
  // Deduplicar: máximo 1 notificação PLAN_LIMIT_NEAR por FEATURE por dia.
  // Sem o `feature` na chave, atingir 80% em cálculos suprimia o aviso de
  // petições (ou qualquer outra feature) no mesmo dia — só a primeira
  // notificação do dia, de qualquer tipo, passava.
  const today = new Date().toISOString().slice(0, 10)
  const dedupKey = `plan-limit-notif:${userId}:${feature}:${today}`
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
  | 'DIAGNOSIS'
  | 'USE_BPC_MODULE'
  | 'PETICAO'
  | 'REVISION_MODULE'
  | 'GPS_MODULE'
  | 'VIABILITY_SCORE'


const FEATURE_MAP: Record<PlanFeature, keyof PlanLimit> = {
  SIMULATOR: 'simulatorEnabled',
  RETROATIVOS: 'retroactiveEnabled',
  EXPORT_PDF: 'exportPdfEnabled',
  DIAGNOSIS: 'diagnosisEnabled',
  USE_BPC_MODULE: 'bpcEnabled',
  PETICAO: 'peticaoEnabled',
  REVISION_MODULE: 'revisionEnabled',
  GPS_MODULE: 'gpsEnabled',
  VIABILITY_SCORE: 'viabilityScoreEnabled',

}

const FEATURE_LABELS: Record<PlanFeature, string> = {
  SIMULATOR: 'Simulador de benefício',
  RETROATIVOS: 'Cálculo de retroativos',
  EXPORT_PDF: 'Exportar PDF',
  DIAGNOSIS: 'Diagnóstico IA',
  USE_BPC_MODULE: 'Módulo BPC/LOAS',
  PETICAO: 'Petição Inicial com IA',
  REVISION_MODULE: 'Revisão de Benefícios',
  GPS_MODULE: 'Guias de Contribuição (GPS/DAS)',
  VIABILITY_SCORE: 'Score de Viabilidade',

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
        peticoesThisMonth: 0,
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

  const count = await prisma.client.count({ where: { userId, active: true } })
  if (count >= limit.maxClients) {
    throw new PlanLimitError(
      `Você atingiu o limite de ${limit.maxClients} clientes ativos no plano ${plan}. Desative ou exclua um cliente, ou atualize seu plano para criar mais.`,
      'CLIENTS',
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }
}

// Recalcula quais clientes ficam `active` sempre que o plano do usuário muda
// (upgrade, downgrade ou cancelamento). Se o novo limite comporta todos os
// clientes, todos voltam a ficar ativos — mesmo os que estavam bloqueados
// por um downgrade anterior (evita ficar "preso" numa escolha antiga e
// mantém o modelo simples: o usuário sempre gerencia o estado atual).
// Caso contrário, mantém ativos os clientes mais antigos (por `createdAt`)
// até o limite, e desativa o restante — que passa a ficar somente-leitura
// até o usuário liberar espaço manualmente (ativar outro/excluir) ou fazer
// upgrade.
export async function reconcileClientActivation(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)

  if (limit.maxClients === -1) {
    await prisma.client.updateMany({ where: { userId, active: false }, data: { active: true } })
    return
  }

  const totalCount = await prisma.client.count({ where: { userId } })
  if (totalCount <= limit.maxClients) {
    await prisma.client.updateMany({ where: { userId, active: false }, data: { active: true } })
    return
  }

  const keep = await prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: limit.maxClients,
    select: { id: true },
  })
  const keepIds = keep.map((c) => c.id)

  await prisma.$transaction([
    prisma.client.updateMany({ where: { userId, id: { notIn: keepIds } }, data: { active: false } }),
    prisma.client.updateMany({ where: { userId, id: { in: keepIds } }, data: { active: true } }),
  ])
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
      'CALCULATIONS',
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
      'OPINIONS',
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

export async function guardPeticaoLimit(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)
  if (!limit.peticaoEnabled) {
    throw new PlanLimitError(
      'Petição Inicial com IA não está disponível no plano gratuito. Faça upgrade para SOLO ou PRO.',
      'PETICAO',
      'SOLO'
    )
  }

  if (limit.maxPeticoesPerMonth === -1) return

  const record = await getOrResetUsageRecord(userId)
  const currentCount = record?.peticoesThisMonth ?? 0

  if (currentCount >= limit.maxPeticoesPerMonth) {
    throw new PlanLimitError(
      `Limite de ${limit.maxPeticoesPerMonth} petições/mês atingido. Atualize para PRO para petições ilimitadas.`,
      'PETICAO',
      'PRO'
    )
  }

  if (
    limit.maxPeticoesPerMonth > 0 &&
    currentCount / limit.maxPeticoesPerMonth >= NEAR_LIMIT_THRESHOLD
  ) {
    notifyLimitNear(
      userId,
      'PETICAO',
      `Você usou ${currentCount} de ${limit.maxPeticoesPerMonth} petições disponíveis neste mês.`
    )
  }
}

export async function guardRevisionLimit(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)
  if (!limit.revisionEnabled) {
    throw new PlanLimitError(
      'Revisão de Benefícios não está disponível no seu plano. Faça upgrade para PRO.',
      'REVISION_MODULE',
      'PRO'
    )
  }

  if (limit.maxRevisionsPerMonth === -1) return

  const record = await getOrResetUsageRecord(userId)
  const currentCount = record?.revisionsThisMonth ?? 0

  if (currentCount >= limit.maxRevisionsPerMonth) {
    throw new PlanLimitError(
      `Limite de ${limit.maxRevisionsPerMonth} revisões/mês atingido. Atualize para PRO para revisões ilimitadas.`,
      'REVISION_MODULE',
      'PRO'
    )
  }

  if (
    limit.maxRevisionsPerMonth > 0 &&
    currentCount / limit.maxRevisionsPerMonth >= NEAR_LIMIT_THRESHOLD
  ) {
    notifyLimitNear(
      userId,
      'REVISION_MODULE',
      `Você usou ${currentCount} de ${limit.maxRevisionsPerMonth} revisões de benefício disponíveis neste mês.`
    )
  }
}

// ─────────────────────────────────────────
// CONSUMO ATÔMICO DE COTA (evita corrida entre checar e incrementar)
// ─────────────────────────────────────────
//
// O padrão anterior era: guardXLimit() lê o contador e decide se permite,
// e só depois — em uma chamada separada — o contador é incrementado. Duas
// requisições concorrentes podem passar pelo guard ao mesmo tempo (ambas
// veem contador == limite-1) e as duas incrementam, estourando o limite.
// tryConsumeMonthlyUsage() faz a checagem e o incremento em uma única
// operação atômica no banco (`UPDATE ... WHERE campo < limite`), que o
// Postgres serializa por linha — só passa quem realmente ainda tinha
// cota no momento exato do incremento.

export type MonthlyUsageField =
  | 'calculationsThisMonth'
  | 'opinionsThisMonth'
  | 'bpcAnalysesThisMonth'
  | 'peticoesThisMonth'
  | 'revisionsThisMonth'

const FIELD_TO_LIMIT_KEY: Record<MonthlyUsageField, keyof PlanLimit> = {
  calculationsThisMonth: 'maxCalculationsPerMonth',
  opinionsThisMonth: 'maxOpinionsPerMonth',
  bpcAnalysesThisMonth: 'bpcAnalysesPerMonth',
  peticoesThisMonth: 'maxPeticoesPerMonth',
  revisionsThisMonth: 'maxRevisionsPerMonth',
}

function buildIncrementData(field: MonthlyUsageField): Prisma.UsageRecordUpdateManyMutationInput {
  switch (field) {
    case 'calculationsThisMonth':
      return { calculationsThisMonth: { increment: 1 } }
    case 'opinionsThisMonth':
      return { opinionsThisMonth: { increment: 1 } }
    case 'bpcAnalysesThisMonth':
      return { bpcAnalysesThisMonth: { increment: 1 } }
    case 'peticoesThisMonth':
      return { peticoesThisMonth: { increment: 1 } }
    case 'revisionsThisMonth':
      return { revisionsThisMonth: { increment: 1 } }
  }
}

function buildLimitWhere(field: MonthlyUsageField, maxPerMonth: number): Prisma.UsageRecordWhereInput {
  switch (field) {
    case 'calculationsThisMonth':
      return { calculationsThisMonth: { lt: maxPerMonth } }
    case 'opinionsThisMonth':
      return { opinionsThisMonth: { lt: maxPerMonth } }
    case 'bpcAnalysesThisMonth':
      return { bpcAnalysesThisMonth: { lt: maxPerMonth } }
    case 'peticoesThisMonth':
      return { peticoesThisMonth: { lt: maxPerMonth } }
    case 'revisionsThisMonth':
      return { revisionsThisMonth: { lt: maxPerMonth } }
  }
}

/**
 * Incrementa o contador de uso do mês atomicamente. Retorna `false` (sem
 * lançar) se o limite já havia sido atingido por uma requisição concorrente
 * entre o guard e este ponto — nesse caso o chamador decide o que fazer
 * (o trabalho já pode ter sido feito; não vale a pena descartá-lo por uma
 * corrida rara, mas o contador nunca ultrapassa o limite no banco).
 */
export async function tryConsumeMonthlyUsage(
  userId: string,
  plan: string,
  field: MonthlyUsageField
): Promise<boolean> {
  await getOrResetUsageRecord(userId)
  await prisma.usageRecord.upsert({ where: { userId }, create: { userId }, update: {} })

  const limit = await getPlanLimit(plan)
  const maxPerMonth = limit[FIELD_TO_LIMIT_KEY[field]] as number

  if (maxPerMonth === -1) {
    await prisma.usageRecord.update({ where: { userId }, data: buildIncrementData(field) })
    return true
  }

  const result = await prisma.usageRecord.updateMany({
    where: { userId, ...buildLimitWhere(field, maxPerMonth) },
    data: buildIncrementData(field),
  })

  if (result.count === 0) {
    logger.warn(`Cota de ${field} já esgotada no momento do incremento (corrida concorrente) — userId=${userId}`)
    return false
  }

  return true
}

