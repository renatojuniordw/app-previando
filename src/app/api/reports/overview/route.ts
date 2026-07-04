import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { handleApiError } from '@/lib/api-error'

const CACHE_TTL = 300 // 5 minutes
const CACHE_KEY_PREFIX = 'reports:overview:'

interface OverviewData {
  totalClients: number
  totalCases: number
  totalCalculations: number
  avgRmi: number
  totalFeesExpected: number
  totalFeesReceived: number
  totalFeesPending: number
}

async function fetchOverview(userId: string): Promise<OverviewData> {
  const [
    totalClients,
    totalCases,
    totalCalculations,
    selectedCalcs,
    fees,
  ] = await Promise.all([
    prisma.client.count({ where: { userId } }),

    prisma.case.count({ where: { userId } }),

    prisma.calculation.count({ where: { case: { userId } } }),

    prisma.calculation.findMany({
      where: { case: { userId }, isSelected: true },
      select: { rmi: true },
    }),

    prisma.fee.aggregate({
      where: { case: { userId } },
      _sum: { totalAmount: true, paidAmount: true },
      _count: { status: true },
    }),
  ])

  const rmiValues = selectedCalcs.map((c) => Number(c.rmi)).filter((v) => v > 0)
  const avgRmi =
    rmiValues.length > 0
      ? rmiValues.reduce((a, b) => a + b, 0) / rmiValues.length
      : 0

  const paidFees = await prisma.fee.count({
    where: { case: { userId }, status: { in: ['PAID'] } },
  })

  return {
    totalClients,
    totalCases,
    totalCalculations,
    avgRmi: Number(avgRmi.toFixed(2)),
    totalFeesExpected: Number(fees._sum.totalAmount ?? 0),
    totalFeesReceived: Number(fees._sum.paidAmount ?? 0),
    totalFeesPending: fees._count.status - paidFees,
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const userId = session.user.id
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`

    // Try cache
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return NextResponse.json(JSON.parse(cached), {
          headers: { 'Cache-Control': 'private, max-age=0, stale-while-revalidate=120' },
        })
      }
    } catch {
      // Redis unavailable — skip cache
    }

    const data = await fetchOverview(userId)

    // Set cache
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data))
    } catch {
      // Redis unavailable — skip cache write
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=0, stale-while-revalidate=120' },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
