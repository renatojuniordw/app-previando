import { prisma } from './prisma'
import { PlanLimitError } from './api-error'

export type PlanFeature =
  | 'SIMULATOR'
  | 'RETROATIVOS'
  | 'EXPORT_PDF'
  | 'WHATSAPP_SHARE'
  | 'DIAGNOSIS'

const FEATURE_MAP: Record<PlanFeature, keyof import('@prisma/client').PlanLimit> = {
  SIMULATOR: 'simulatorEnabled',
  RETROATIVOS: 'retroactiveEnabled',
  EXPORT_PDF: 'exportPdfEnabled',
  WHATSAPP_SHARE: 'whatsappEnabled',
  DIAGNOSIS: 'diagnosisEnabled',
}

const FEATURE_LABELS: Record<PlanFeature, string> = {
  SIMULATOR: 'Simulador de benefício',
  RETROATIVOS: 'Cálculo de retroativos',
  EXPORT_PDF: 'Exportar PDF',
  WHATSAPP_SHARE: 'Compartilhar via WhatsApp',
  DIAGNOSIS: 'Diagnóstico IA',
}

export async function getPlanLimit(plan: string) {
  const limit = await prisma.planLimit.findUnique({
    where: { plan: plan as import('@prisma/client').Plan },
  })
  if (!limit) throw new Error(`PlanLimit não encontrado para plano: ${plan}`)
  return limit
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
      `Você atingiu o limite de ${limit.maxClients} clientes do plano ${plan}.`,
      'MAX_CLIENTS',
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }
}

export async function guardCalculationLimit(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)
  if (limit.maxCalculationsPerMonth === -1) return

  const usage = await prisma.usageRecord.findUnique({ where: { userId } })
  const count = usage?.calculationsThisMonth ?? 0

  if (count >= limit.maxCalculationsPerMonth) {
    throw new PlanLimitError(
      `Você atingiu o limite de ${limit.maxCalculationsPerMonth} cálculos este mês.`,
      'MAX_CALCULATIONS',
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }
}

export async function guardOpinionLimit(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)
  if (limit.maxOpinionsPerMonth === -1) return

  const usage = await prisma.usageRecord.findUnique({ where: { userId } })
  const count = usage?.opinionsThisMonth ?? 0

  if (count >= limit.maxOpinionsPerMonth) {
    throw new PlanLimitError(
      `Você atingiu o limite de ${limit.maxOpinionsPerMonth} pareceres este mês.`,
      'MAX_OPINIONS',
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }
}
