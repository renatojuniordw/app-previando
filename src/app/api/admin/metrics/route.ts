import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@/auth"
import type { Session } from "next-auth"
import { prisma } from '@/lib/prisma'

function requireAdmin(session: Session | null, req: NextRequest) {
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const guard = requireAdmin(session, req)
  if (guard) return guard

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    usersByPlan,
    newThisMonth,
    soloPayments,
    proPayments,
    soloPaymentsMonth,
    proPaymentsMonth,
    totalCalculations,
    totalOpinions,
    aiCostThisMonth,
    totalCases,
    casesByStatus,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['plan'], _count: true }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({ where: { status: 'APPROVED', plan: 'SOLO' }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'APPROVED', plan: 'PRO' }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'APPROVED', plan: 'SOLO', paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'APPROVED', plan: 'PRO', paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.calculation.count(),
    prisma.opinion.count(),
    prisma.opinion.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { generationCostUsd: true } }),
    prisma.case.count(),
    prisma.case.groupBy({ by: ['status'], _count: true }),
  ])

  const byPlanMap: Record<string, number> = {}
  for (const row of usersByPlan) byPlanMap[row.plan] = row._count

  const byStatusMap: Record<string, number> = {}
  for (const row of casesByStatus) byStatusMap[row.status] = row._count

  const soloMRR = (byPlanMap['SOLO'] ?? 0) * 299
  const proMRR = (byPlanMap['PRO'] ?? 0) * 599

  return NextResponse.json({
    users: {
      total: totalUsers,
      byPlan: { FREE: byPlanMap['FREE'] ?? 0, SOLO: byPlanMap['SOLO'] ?? 0, PRO: byPlanMap['PRO'] ?? 0 },
      newThisMonth,
    },
    revenue: {
      mrr: soloMRR + proMRR,
      totalThisMonth: Number(soloPaymentsMonth._sum.amount ?? 0) + Number(proPaymentsMonth._sum.amount ?? 0),
      totalAllTime: Number(soloPayments._sum.amount ?? 0) + Number(proPayments._sum.amount ?? 0),
    },
    usage: {
      totalCalculations,
      totalOpinions,
      aiCostThisMonthUsd: aiCostThisMonth._sum.generationCostUsd ?? 0,
    },
    cases: {
      total: totalCases,
      byStatus: byStatusMap,
    },
  })
}
