export interface AdminMetrics {
  users: { total: number; byPlan: Record<string, number>; newThisMonth: number }
  revenue: { mrr: number; totalThisMonth: number; totalAllTime: number }
  usage: { totalCalculations: number; totalOpinions: number; aiCostThisMonthUsd: number }
  cases: { total: number; byStatus: Record<string, number> }
}

export function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const PLAN_LABELS: Record<string, string> = { FREE: 'FREE', SOLO: 'SOLO', PRO: 'PRO', PARTNER: 'PARCEIRO' }
