import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { handleApiError } from '@/lib/api-error'

/**
 * TODO — Otimização de queries (Performance/Arquitetura):
 *
 * O fetchOverview() faz 5 queries independentes dentro de Promise.all:
 *   1. client.count     (totalClients)
 *   2. case.count       (totalCases)
 *   3. calculation.count(totalCalculations)
 *   4. calculation.findMany + rmi filter  (avgRmi)
 *   5. fee.aggregate    (totalFeesEsperado/Recebido)
 *
 * As queries 1, 2 e 3 poderiam ser combinadas em uma única query SQL com
 * COUNT + GROUP BY por tabela (ex.: UNION ALL com agregação), reduzindo
 * de 5 para 3 ou até 2 round-trips ao banco.
 *
 * Exemplo conceitual (raw SQL):
 *   SELECT 'clients' AS entity, COUNT(*) AS value FROM "clients" WHERE "userId" = $1
 *   UNION ALL
 *   SELECT 'cases', COUNT(*) FROM "cases" WHERE "userId" = $1
 *   UNION ALL
 *   SELECT 'calculations', COUNT(*) FROM "calculations" WHERE "case"."userId" = $1
 *
 * A query 4 (avgRmi) também poderia ser agregada na query de cases/calculations
 * se usarmos AVG(rmi) com FILTER(WHERE isSelected).
 *
 * Pendente de refatoração quando a performance do dashboard for priorizada.
 */

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

    // Honorários cancelados não contam como receita esperada nem pendente.
    prisma.fee.aggregate({
      where: { case: { userId }, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
  ])

  const rmiValues = selectedCalcs.map((c) => Number(c.rmi)).filter((v) => v > 0)
  const avgRmi =
    rmiValues.length > 0
      ? rmiValues.reduce((a, b) => a + b, 0) / rmiValues.length
      : 0

  const totalFeesExpected = Number(fees._sum.totalAmount ?? 0)
  const totalFeesReceived = Number(fees._sum.paidAmount ?? 0)

  return {
    totalClients,
    totalCases,
    totalCalculations,
    avgRmi: Number(avgRmi.toFixed(2)),
    totalFeesExpected,
    totalFeesReceived,
    totalFeesPending: totalFeesExpected - totalFeesReceived,
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
