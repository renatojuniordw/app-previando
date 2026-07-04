import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

/**
 * GET /api/dashboard/insights
 *
 * Métricas acionáveis: receita potencial, alertas inteligentes, tempo médio por status.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const userId = session.user.id
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [
      selectedCalcs,
      criticalCases,
      deadlinesToday,
      staleClients,
      usageRecord,
      planLimit,
      casesByStatus,
    ] = await Promise.all([
      // Cálculos selecionados para receita potencial
      prisma.calculation.findMany({
        where: { case: { userId }, isSelected: true },
        select: {
          rmi: true,
          case: {
            select: {
              createdAt: true,
              deadlineDate: true,
              status: true,
              benefitType: true,
            },
          },
        },
      }),

      // Casos críticos em aberto
      prisma.case.findMany({
        where: { userId, priority: 'CRITICAL', status: { not: 'FINISHED' } },
        select: {
          id: true,
          benefitType: true,
          deadlineDate: true,
          client: { select: { name: true } },
        },
        orderBy: { deadlineDate: 'asc' },
        take: 10,
      }),

      // Prazos vencendo hoje
      prisma.case.findMany({
        where: {
          userId,
          deadlineDate: { gte: today, lte: todayEnd },
          status: { not: 'FINISHED' },
        },
        select: {
          id: true,
          benefitType: true,
          deadlineDate: true,
          client: { select: { name: true } },
        },
      }),

      // Clientes sem atualização há mais de 60 dias
      prisma.client.count({
        where: {
          userId,
          updatedAt: { lt: sixtyDaysAgo },
          cases: { some: { status: { not: 'FINISHED' } } },
        },
      }),

      // Uso atual do plano
      prisma.usageRecord.findUnique({
        where: { userId },
        select: {
          calculationsThisMonth: true,
          opinionsThisMonth: true,
          bpcAnalysesThisMonth: true,
          totalClients: true,
        },
      }),

      // Limites do plano
      prisma.planLimit.findUnique({
        where: { plan: ((session.user.plan as string) ?? 'FREE') as import('@prisma/client').Plan },
        select: {
          maxCalculationsPerMonth: true,
          maxOpinionsPerMonth: true,
          maxClients: true,
        },
      }),

      // Tempo médio por status via raw aggregate query
      prisma.$queryRaw<Array<{ status: string; avg_days: number }>>`
        SELECT
          "status"::text as status,
          AVG(EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 86400) as avg_days
        FROM "cases"
        WHERE "userId" = ${userId}::text
        GROUP BY "status"
      `,
    ])

    // ── Receita potencial ──────────────────────────────────────────────
    const rmiValues = selectedCalcs.map((c) => Number(c.rmi)).filter((v) => v > 0)
    const totalRmiPotencial = rmiValues.reduce((a, b) => a + b, 0)

    // Honorários estimados (20% × 24 meses de retroativo médio)
    const estimatedFees = totalRmiPotencial * 0.2 * 24

    // ── Tempo médio em cada status ────────────────────────────────────
    const avgDaysByStatus = Object.fromEntries(
      casesByStatus
        .filter((s) => s.avg_days !== null)
        .map((s) => [s.status, Math.round(s.avg_days)])
    )

    // ── Uso do plano ───────────────────────────────────────────────────
    const usage = {
      calculations: {
        used: usageRecord?.calculationsThisMonth ?? 0,
        limit: planLimit?.maxCalculationsPerMonth ?? 0,
      },
      opinions: {
        used: usageRecord?.opinionsThisMonth ?? 0,
        limit: planLimit?.maxOpinionsPerMonth ?? 0,
      },
      clients: {
        used: usageRecord?.totalClients ?? 0,
        limit: planLimit?.maxClients ?? 0,
      },
    }

    return NextResponse.json({
      revenuePotential: {
        totalRmiPotencial: Number(totalRmiPotencial.toFixed(2)),
        estimatedFees: Number(estimatedFees.toFixed(2)),
        selectedCalculations: rmiValues.length,
      },
      alerts: {
        criticalCases,
        deadlinesToday,
        staleClientsCount: staleClients,
      },
      avgDaysByStatus,
      usage,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
