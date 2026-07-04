import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { getCalendarClient } from '@/services/google-calendar'

interface CalendarEvent {
  id: string
  type: 'deadline' | 'google_event'
  title: string
  description?: string
  date: string
  caseId?: string
  clientName?: string
}

interface EventsByDate {
  [date: string]: CalendarEvent[]
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const userId = session.user.id
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + 90)
    end.setHours(23, 59, 59, 999)

    const eventsByDate: EventsByDate = {}

    const addEvent = (dateKey: string, event: CalendarEvent) => {
      if (!eventsByDate[dateKey]) eventsByDate[dateKey] = []
      eventsByDate[dateKey].push(event)
    }

    // 1. Prazos de casos
    const deadlines = await prisma.case.findMany({
      where: {
        userId,
        deadlineDate: { gte: now, lte: end },
        status: { notIn: ['FINISHED'] },
      },
      select: {
        id: true,
        deadlineDate: true,
        benefitType: true,
        client: { select: { name: true } },
      },
      orderBy: { deadlineDate: 'asc' },
    })

    for (const d of deadlines) {
      if (!d.deadlineDate) continue
      const dateKey = d.deadlineDate.toISOString().split('T')[0]
      addEvent(dateKey, {
        id: `deadline-${d.id}`,
        type: 'deadline',
        title: `Prazo: ${d.client.name}`,
        date: dateKey,
        caseId: d.id,
        clientName: d.client.name,
      })
    }

    // 2. Eventos do Google Calendar
    const calendar = await getCalendarClient(userId)
    if (calendar) {
      try {
        const res = await calendar.events.list({
          calendarId: 'primary',
          timeMin: now.toISOString(),
          timeMax: end.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 100,
        })

        const items = res.data.items ?? []
        for (const ev of items) {
          const dateStr = ev.start?.date ?? ev.start?.dateTime?.split('T')[0]
          if (!dateStr) continue

          addEvent(dateStr, {
            id: `google-${ev.id}`,
            type: 'google_event',
            title: ev.summary ?? 'Evento sem título',
            description: ev.description ?? undefined,
            date: dateStr,
          })
        }
      } catch {
        // Falha na API do Google — apenas ignora eventos externos
      }
    }

    // Ordena eventos dentro de cada data
    for (const dateKey of Object.keys(eventsByDate)) {
      eventsByDate[dateKey].sort((a, b) => {
        const typeOrder = { deadline: 0, google_event: 1 }
        return (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99)
      })
    }

    return NextResponse.json({
      startDate: now.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      eventsByDate,
    }, {
      headers: { 'Cache-Control': 'private, max-age=0, stale-while-revalidate=60' },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
