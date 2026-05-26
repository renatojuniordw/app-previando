import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { mapCaseStatusToApi, mapNoteTypeToApi } from '@/lib/mappers'

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
          status: { not: 'FINISHED' },
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

    const statusMap = Object.fromEntries(
      casesByStatus.map((g) => [mapCaseStatusToApi(g.status), g._count.status])
    )

    const mappedRecentNotes = recentNotes.map((n) => ({
      ...n,
      type: mapNoteTypeToApi(n.type),
      content: n.content.slice(0, 120) + (n.content.length > 120 ? '...' : ''),
    }))

    return NextResponse.json({
      totalClients,
      cases: {
        total: (Object.values(statusMap) as number[]).reduce((a, b) => a + b, 0),
        byStatus: statusMap,
        critical: criticalCases,
      },
      recentNotes: mappedRecentNotes,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
