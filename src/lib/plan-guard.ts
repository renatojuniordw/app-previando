import { prisma } from './prisma'
import { PlanLimitError } from './api-error'

export type PlanFeature =
  | 'SIMULATOR'
  | 'RETROATIVOS'
  | 'EXPORT_PDF'
  | 'WHATSAPP_SHARE'
  | 'DIAGNOSIS'
  | 'USE_BPC_MODULE'
  | 'BPC_SOCIAL_MEDIA'

const FEATURE_MAP: Record<PlanFeature, keyof import('@prisma/client').PlanLimit> = {
  SIMULATOR: 'simulatorEnabled',
  RETROATIVOS: 'retroactiveEnabled',
  EXPORT_PDF: 'exportPdfEnabled',
  WHATSAPP_SHARE: 'whatsappEnabled',
  DIAGNOSIS: 'diagnosisEnabled',
  USE_BPC_MODULE: 'bpcEnabled',
  BPC_SOCIAL_MEDIA: 'bpcEnabled',
}

const FEATURE_LABELS: Record<PlanFeature, string> = {
  SIMULATOR: 'Simulador de benefício',
  RETROATIVOS: 'Cálculo de retroativos',
  EXPORT_PDF: 'Exportar PDF',
  WHATSAPP_SHARE: 'Compartilhar via WhatsApp',
  DIAGNOSIS: 'Diagnóstico IA',
  USE_BPC_MODULE: 'Módulo BPC/LOAS',
  BPC_SOCIAL_MEDIA: 'Gerador de carrossel BPC',
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

export async function guardBpcAnalysisLimit(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)
  if (!limit.bpcEnabled) {
    throw new PlanLimitError(
      'Módulo BPC/LOAS disponível a partir do plano SOLO.',
      'USE_BPC_MODULE',
      'SOLO'
    )
  }
  if (limit.bpcAnalysesPerMonth === -1) return

  const usage = await prisma.usageRecord.findUnique({ where: { userId } })
  const count = usage?.bpcAnalysesThisMonth ?? 0

  if (count >= limit.bpcAnalysesPerMonth) {
    throw new PlanLimitError(
      `Você atingiu o limite de ${limit.bpcAnalysesPerMonth} análises BPC este mês.`,
      'MAX_BPC_ANALYSES',
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }
}

export async function guardBpcSocialMediaLimit(userId: string, plan: string): Promise<void> {
  const limit = await getPlanLimit(plan)
  if (!limit.bpcEnabled) {
    throw new PlanLimitError(
      'Gerador de carrossel disponível a partir do plano SOLO.',
      'BPC_SOCIAL_MEDIA',
      'SOLO'
    )
  }
  if (limit.bpcSocialMediaPerMonth === -1) return

  const usage = await prisma.usageRecord.findUnique({ where: { userId } })
  const count = usage?.bpcSocialMediaThisMonth ?? 0

  if (count >= limit.bpcSocialMediaPerMonth) {
    throw new PlanLimitError(
      `Você atingiu o limite de ${limit.bpcSocialMediaPerMonth} carrosséis este mês.`,
      'MAX_BPC_SOCIAL_MEDIA',
      plan === 'FREE' ? 'SOLO' : 'PRO'
    )
  }
}
