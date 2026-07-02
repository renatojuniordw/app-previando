import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
  )
}

async function getGoogleAccount(userId: string) {
  return prisma.account.findFirst({
    where: { userId, provider: 'google' },
    select: { access_token: true, refresh_token: true, scope: true },
  })
}

export async function hasCalendarAccess(userId: string): Promise<boolean> {
  const account = await getGoogleAccount(userId)
  if (!account?.access_token) return false
  return account.scope?.includes('calendar') ?? false
}

export async function getCalendarClient(userId: string) {
  const account = await getGoogleAccount(userId)
  if (!account?.access_token) return null

  const auth = createOAuthClient()
  auth.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
  })

  // Persiste novo access_token se o OAuth2 o rotacionar via refresh
  auth.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.account.updateMany({
        where: { userId, provider: 'google' },
        data: { access_token: tokens.access_token },
      })
    }
  })

  return google.calendar({ version: 'v3', auth })
}

export async function createCalendarEvent(
  userId: string,
  event: { title: string; description?: string; date: Date },
): Promise<string | null> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return null

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        description: event.description,
        start: { date: event.date.toISOString().split('T')[0], timeZone: 'America/Sao_Paulo' },
        end: { date: event.date.toISOString().split('T')[0], timeZone: 'America/Sao_Paulo' },
      },
    })
    return res.data.id ?? null
  } catch {
    return null
  }
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  event: { title: string; description?: string; date: Date },
): Promise<boolean> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return false

  try {
    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: event.title,
        description: event.description,
        start: { date: event.date.toISOString().split('T')[0], timeZone: 'America/Sao_Paulo' },
        end: { date: event.date.toISOString().split('T')[0], timeZone: 'America/Sao_Paulo' },
      },
    })
    return true
  } catch {
    return false
  }
}

export async function deleteCalendarEvent(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return false

  try {
    await calendar.events.delete({ calendarId: 'primary', eventId })
    return true
  } catch {
    return false
  }
}

/**
 * Sincroniza os prazos de todos os casos ativos do usuário como eventos no Google Calendar.
 * Cria eventos apenas para casos que ainda não possuem googleCalendarEventId.
 * Retorna o número de eventos criados.
 */
export async function syncCaseDeadlinesToCalendar(userId: string): Promise<number> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return 0

  const cases = await prisma.case.findMany({
    where: {
      userId,
      deadlineDate: { not: null },
      googleCalendarEventId: null,
      status: { notIn: ['FINISHED'] },
    },
    select: {
      id: true,
      deadlineDate: true,
      benefitType: true,
      client: { select: { name: true } },
    },
  })

  let created = 0

  for (const c of cases) {
    if (!c.deadlineDate) continue

    try {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: `Prazo: ${c.client.name}`,
          description: `Prazo do caso de ${c.client.name} — vence em ${c.deadlineDate.toLocaleDateString('pt-BR')}`,
          start: { date: c.deadlineDate.toISOString().split('T')[0] },
          end: { date: c.deadlineDate.toISOString().split('T')[0] },
        },
      })

      if (res.data.id) {
        await prisma.case.update({
          where: { id: c.id },
          data: { googleCalendarEventId: res.data.id },
        })
        created++
      }
    } catch {
      // Falha silenciosa — não quebra o worker por um evento individual
      continue
    }
  }

  return created
}

export interface CalendarSyncResult {
  created: number
  total: number
}
