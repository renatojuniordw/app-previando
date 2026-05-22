import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const userId = session.user.id

    const [totalClients, casesByStatus, criticalCases, recentNotes] = await Promise.all([
      prisma.client.count({ where: { userId } }),
      prisma.case.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),
      prisma.case.count({
        where: {
          userId,
          priority: 'CRITICAL',
          status: { not: 'FINALIZADO' },
        },
      }),
      prisma.caseNote.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          content: true,
          createdAt: true,
          case: { select: { id: true, client: { select: { name: true } } } },
        },
      }),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusMap = Object.fromEntries(
      (casesByStatus as any[]).map((g) => [g.status, g._count.status])
    )

    return NextResponse.json({
      totalClients,
      cases: {
        total: (Object.values(statusMap) as number[]).reduce((a, b) => a + b, 0),
        byStatus: statusMap,
        critical: criticalCases,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentNotes: (recentNotes as any[]).map((n) => ({
        ...n,
        content: n.content.slice(0, 120) + (n.content.length > 120 ? '...' : ''),
      })),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
