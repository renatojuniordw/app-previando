import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { mapCaseStatusToApi, mapNoteTypeToApi } from '@/lib/mappers'
import { getCalendarClient } from '@/services/google-calendar'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const userId = session.user.id
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalClients,
      casesByStatus,
      criticalCases,
      recentNotes,
      casesByBenefitType,
      casesCreatedByMonth,
      totalCalculations,
      selectedCalculations,
      upcomingDeadlines,
      calendarEvents,
      clientsByPriority,
    ] = await Promise.all([
      prisma.client.count({ where: { userId } }),

      prisma.case.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),

      prisma.case.count({
        where: { userId, priority: 'CRITICAL', status: { not: 'FINISHED' } },
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

      prisma.case.groupBy({
        by: ['benefitType'],
        where: { userId },
        _count: { benefitType: true },
      }),

      // Casos criados por mês nos últimos 6 meses
      prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
        FROM cases
        WHERE "userId" = ${userId}
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY month
        ORDER BY month ASC
      `,

      prisma.calculation.count({ where: { case: { userId } } }),

      prisma.calculation.findMany({
        where: { case: { userId }, isSelected: true },
        select: { rmi: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),

      // Próximos 7 dias de prazo
      prisma.case.findMany({
        where: {
          userId,
          deadlineDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          status: { notIn: ['FINISHED'] },
        },
        select: {
          id: true,
          deadlineDate: true,
          benefitType: true,
          client: { select: { name: true } },
        },
        orderBy: { deadlineDate: 'asc' },
        take: 10,
      }),

      // Google Calendar events for next 7 days
      (async () => {
        const calendar = await getCalendarClient(userId)
        if (!calendar) return []
        try {
          const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 10,
          })
          return (res.data.items ?? []).map((ev) => ({
            id: ev.id ?? '',
            title: ev.summary ?? 'Evento',
            date: ev.start?.date ?? ev.start?.dateTime?.split('T')[0] ?? '',
          }))
        } catch {
          return []
        }
      })(),

      prisma.client.groupBy({
        by: ['priority'],
        where: { userId },
        _count: { priority: true },
      }),
    ])

    const statusMap = Object.fromEntries(
      casesByStatus.map((g) => [mapCaseStatusToApi(g.status), g._count.status])
    )

    const rmiValues = selectedCalculations.map((c) => Number(c.rmi)).filter((v) => v > 0)
    const avgRmi = rmiValues.length > 0 ? rmiValues.reduce((a, b) => a + b, 0) / rmiValues.length : 0
    const totalRmiPotencial = rmiValues.reduce((a, b) => a + b, 0)

    return NextResponse.json({
      totalClients,
      cases: {
        total: (Object.values(statusMap) as number[]).reduce((a, b) => a + b, 0),
        byStatus: statusMap,
        critical: criticalCases,
        byBenefitType: Object.fromEntries(
          casesByBenefitType.map((g) => [g.benefitType, g._count.benefitType])
        ),
        createdByMonth: casesCreatedByMonth.map((r) => ({
          month: r.month,
          count: Number(r.count),
        })),
      },
      calculations: {
        total: totalCalculations,
        avgRmi: Number(avgRmi.toFixed(2)),
        totalRmiPotencial: Number(totalRmiPotencial.toFixed(2)),
      },
      upcomingDeadlines,
      upcomingEvents: {
        deadlines: upcomingDeadlines,
        calendarEvents: calendarEvents as Array<{ id: string; title: string; date: string }>,
      },
      clientsByPriority: Object.fromEntries(
        clientsByPriority.map((g) => [g.priority, g._count.priority])
      ),
      recentNotes: recentNotes.map((n) => ({
        ...n,
        type: mapNoteTypeToApi(n.type),
        content: n.content.slice(0, 120) + (n.content.length > 120 ? '...' : ''),
      })),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
