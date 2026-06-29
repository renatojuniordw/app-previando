import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { handleApiError } from '@/lib/api-error'
import {
  mapCaseStatusToApi,
  mapBenefitTypeToApi,
} from '@/lib/mappers'

const CACHE_TTL = 300 // 5 minutes
const CACHE_KEY_PREFIX = 'reports:operacional:'

interface OperacionalData {
  casesByPhase: Record<string, number>
  avgDaysPerPhase: Record<string, number>
  distributionByBenefitType: Record<string, number>
  casesCreatedByMonth: Array<{ month: string; count: number }>
}

async function fetchOperacional(
  userId: string,
  days: number
): Promise<OperacionalData> {
  const now = new Date()
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const [casesByStatus, casesByBenefitType, casesCreatedByMonth, casesForAvg] =
    await Promise.all([
      prisma.case.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),

      prisma.case.groupBy({
        by: ['benefitType'],
        where: { userId },
        _count: { benefitType: true },
      }),

      // Casos criados por mês no período
      prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
        FROM cases
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${periodStart}
        GROUP BY month
        ORDER BY month ASC
      `,

      // Para cálculo de tempo médio por fase
      prisma.case.findMany({
        where: { userId },
        select: {
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

  // Cases by phase (mapped to PT-BR)
  const casesByPhase: Record<string, number> = {}
  for (const g of casesByStatus) {
    const apiStatus = mapCaseStatusToApi(g.status)
    casesByPhase[apiStatus] = g._count.status
  }

  // Avg days per phase
  const timeByPhase: Record<string, number[]> = {}
  for (const c of casesForAvg) {
    const apiStatus = mapCaseStatusToApi(c.status)
    const referenceDate =
      c.status === 'FINISHED' ? c.updatedAt : now
    const daysDiff =
      (referenceDate.getTime() - c.createdAt.getTime()) /
      (1000 * 60 * 60 * 24)
    if (!timeByPhase[apiStatus]) timeByPhase[apiStatus] = []
    timeByPhase[apiStatus].push(daysDiff)
  }

  const avgDaysPerPhase: Record<string, number> = {}
  for (const [status, daysArr] of Object.entries(timeByPhase)) {
    avgDaysPerPhase[status] = Math.round(
      daysArr.reduce((a, b) => a + b, 0) / daysArr.length
    )
  }

  // Distribution by benefit type
  const distributionByBenefitType: Record<string, number> = {}
  for (const g of casesByBenefitType) {
    const apiType = mapBenefitTypeToApi(g.benefitType)
    distributionByBenefitType[apiType] = g._count.benefitType
  }

  return {
    casesByPhase,
    avgDaysPerPhase,
    distributionByBenefitType,
    casesCreatedByMonth: casesCreatedByMonth.map((r) => ({
      month: r.month,
      count: Number(r.count),
    })),
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

    const data = await fetchOperacional(userId, days)

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
