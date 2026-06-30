import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { handleApiError } from '@/lib/api-error'

const CACHE_TTL = 300 // 5 minutes
const CACHE_KEY_PREFIX = 'reports:financeiro:'

interface FeeByMonth {
  month: string
  expected: number
  realized: number
}

interface FinanceiroData {
  feesByMonth: FeeByMonth[]
  potentialRevenue: number
  averageTicket: number
  conversionRate: number
  totalFeesExpected: number
  totalFeesReceived: number
}

async function fetchFinanceiro(
  userId: string,
  days: number
): Promise<FinanceiroData> {
  const now = new Date()
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const [totalCases, finishedCases, selectedCalcs, feesRaw] =
    await Promise.all([
      prisma.case.count({ where: { userId } }),

      prisma.case.count({
        where: { userId, status: 'FINISHED' },
      }),

      prisma.calculation.findMany({
        where: { case: { userId }, isSelected: true },
        select: { rmi: true },
      }),

      // Fees in the period — raw SQL for monthly grouping
      prisma.$queryRaw<
        Array<{ month: string; expected: string; realized: string }>
      >`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          COALESCE(SUM("totalAmount")::text, '0') AS expected,
          COALESCE(SUM("paidAmount")::text, '0') AS realized
        FROM fees
        WHERE
          "caseId" IN (SELECT id FROM cases WHERE "userId" = ${userId})
          AND "createdAt" >= ${periodStart}
        GROUP BY month
        ORDER BY month ASC
      `,

      prisma.case.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),
    ])

  // Potential revenue (20% x 24 months of average retroactive)
  const rmiValues = selectedCalcs.map((c) => Number(c.rmi)).filter((v) => v > 0)
  const totalRmiPotencial = rmiValues.reduce((a, b) => a + b, 0)
  const potentialRevenue = totalRmiPotencial * 0.2 * 24

  // Average ticket (mean fee totalAmount)
  const feeAgg = await prisma.fee.aggregate({
    where: { case: { userId } },
    _avg: { totalAmount: true },
    _sum: { totalAmount: true, paidAmount: true },
  })
  const averageTicket = Number(feeAgg._avg.totalAmount ?? 0)

  // Conversion rate
  const conversionRate =
    totalCases > 0 ? Number(((finishedCases / totalCases) * 100).toFixed(1)) : 0

  const feesByMonth = feesRaw.map((r) => ({
    month: r.month,
    expected: Number(r.expected),
    realized: Number(r.realized),
  }))

  return {
    feesByMonth,
    potentialRevenue: Number(potentialRevenue.toFixed(2)),
    averageTicket: Number(averageTicket.toFixed(2)),
    conversionRate,
    totalFeesExpected: Number(feeAgg._sum.totalAmount ?? 0),
    totalFeesReceived: Number(feeAgg._sum.paidAmount ?? 0),
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const userId = session.user.id
    const days = Math.min(
      Math.max(Number(req.nextUrl.searchParams.get('days')) || 90, 1),
      365
    )
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}:${days}`

    // Try cache
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return NextResponse.json(JSON.parse(cached))
      }
    } catch {
      // Redis unavailable
    }

    const data = await fetchFinanceiro(userId, days)

    // Set cache
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data))
    } catch {
      // Redis unavailable
    }

    return NextResponse.json(data)
  } catch (err) {
    return handleApiError(err)
  }
}
