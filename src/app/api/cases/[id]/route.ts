import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { sanitizeInput } from '@/lib/sanitize'
import { handleApiError } from '@/lib/api-error'
import { getTribunalId } from '@/lib/cnj-parser'
import { logAudit } from '@/lib/audit'
import { getPlanLimit } from '@/lib/plan-guard'
import { mapCaseStatusToDb, mapCaseToApi, ApiCaseStatus } from '@/lib/mappers'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/services/google-calendar'
import { trackjud } from '@/services/trackjud'
import { Logger } from '@/lib/logger'

const logger = new Logger('CaseUpdate')

const CNJ_PROCESS_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$|^\d{20}$/

const updateSchema = z.object({
  status: z.enum(['PROSPECCAO', 'ANALISE', 'PRONTO_PARA_REQUERER', 'EM_PROCESSAMENTO', 'FINALIZADO']).optional(),
  priority: z.enum(['CRITICAL', 'ATTENTION', 'NORMAL']).optional(),
  deadlineDays: z.number().int().positive().nullable().optional(),
  deadlineDate: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  processNumber: z.string().regex(CNJ_PROCESS_REGEX, 'Formato inválido. Use NNNNNNN-DD.AAAA.J.TT.OOOO').nullable().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        cnisDocument: true,
        calculations: { orderBy: { createdAt: 'desc' } },
        opinions: { orderBy: { createdAt: 'desc' }, select: { id: true, status: true, createdAt: true } },
        checklists: { orderBy: { createdAt: 'desc' }, take: 1 },
        simulations: { orderBy: { createdAt: 'desc' } },
        retroactives: { orderBy: { createdAt: 'desc' } },
        _count: { select: { caseNotes: true } },
      },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })

    const planLimits = await getPlanLimit(session.user.plan)

    return NextResponse.json({
      case: {
        ...mapCaseToApi(caso),
        planLimits: {
          simulatorEnabled: planLimits.simulatorEnabled,
          retroativosEnabled: planLimits.retroactiveEnabled,
          bpcEnabled: planLimits.bpcEnabled,
          diagnosisEnabled: planLimits.diagnosisEnabled,
          peticaoEnabled: planLimits.peticaoEnabled,
          processInterpretEnabled: planLimits.processInterpretEnabled,
        },
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.status) data.status = mapCaseStatusToDb(parsed.data.status as ApiCaseStatus)
    if (parsed.data.priority) data.priority = parsed.data.priority
    if (parsed.data.deadlineDays !== undefined) data.deadlineDays = parsed.data.deadlineDays
    if (parsed.data.deadlineDate !== undefined)
      data.deadlineDate = parsed.data.deadlineDate ? new Date(parsed.data.deadlineDate) : null
    if (parsed.data.notes !== undefined)
      data.notes = parsed.data.notes ? sanitizeInput(parsed.data.notes) : null
    if (parsed.data.processNumber !== undefined)
      data.processNumber = parsed.data.processNumber

    const casoAntes = await prisma.case.findUnique({
      where: { id: params.id },
      select: {
        googleCalendarEventId: true,
        deadlineDate: true,
        benefitType: true,
        processNumber: true,
        trackjudMonitorId: true,
        client: { select: { name: true } },
      },
    })

    const caso = await prisma.case.update({
      where: { id: params.id },
      data,
      include: { client: { select: { name: true } } },
    })

    if (parsed.data.deadlineDate !== undefined) {
      const newDate = parsed.data.deadlineDate ? new Date(parsed.data.deadlineDate) : null
      const existingEventId = casoAntes?.googleCalendarEventId ?? null
      const clientName = caso.client?.name ?? 'Cliente'
      const title = `Prazo: ${clientName} — ${caso.benefitType.replace(/_/g, ' ')}`
      const description = (parsed.data.notes ?? undefined) as string | undefined

      if (newDate && existingEventId) {
        await updateCalendarEvent(session.user.id, existingEventId, { title, description, date: newDate })
      } else if (newDate && !existingEventId) {
        const calendarEventId = await createCalendarEvent(session.user.id, { title, description, date: newDate })
        if (calendarEventId) {
          await prisma.case.update({ where: { id: params.id }, data: { googleCalendarEventId: calendarEventId } })
        }
      } else if (!newDate && existingEventId) {
        await deleteCalendarEvent(session.user.id, existingEventId)
        await prisma.case.update({ where: { id: params.id }, data: { googleCalendarEventId: null } })
      }
    }

    // ─── TrackJud: register/unregister monitor quando processNumber muda ──
    if (parsed.data.processNumber !== undefined) {
      const oldProcessNumber = casoAntes?.processNumber ?? null
      const newProcessNumber = parsed.data.processNumber

      if (newProcessNumber !== oldProcessNumber) {
        // Se havia um processo monitorado anteriormente, cancela
        if (oldProcessNumber && casoAntes?.trackjudMonitorId) {
          await trackjud.unregisterProcess(casoAntes.trackjudMonitorId).catch(() => {
            logger.warn(`Falha ao cancelar monitoramento ${casoAntes.trackjudMonitorId}`)
          })
          await prisma.case.update({
            where: { id: params.id },
            data: { trackjudMonitorId: null, trackjudRegisteredAt: null },
          })
        }

        // Se há um novo número, registra no TrackJud
        if (newProcessNumber) {
          try {
            // Identifica o tribunal a partir do número CNJ para evitar consultas desnecessárias
            const tribunal = getTribunalId(newProcessNumber)
            const { monitorId } = await trackjud.registerProcess({
              processNumber: newProcessNumber,
              tribunal: tribunal ?? undefined,
            })
            await prisma.case.update({
              where: { id: params.id },
              data: { trackjudMonitorId: monitorId, trackjudRegisteredAt: new Date() },
            })
            logger.info(`Processo ${newProcessNumber} registrado no TrackJud: monitorId=${monitorId} tribunal=${tribunal}`)
          } catch (err) {
            // Não bloqueia o save do caso — loga a falha e continua
            logger.warn(`Falha ao registrar processo ${newProcessNumber} no TrackJud`, err)
          }
        }
      }
    }

    const action = parsed.data.status ? 'case.status.changed' : 'case.updated'
    await logAudit({
      userId: session.user.id,
      action,
      resource: `Caso (${caso.benefitType.replace(/_/g, ' ')}) - ${caso.client?.name ?? 'Cliente'}`,
      req,
      metadata: {
        caseId: caso.id,
        clientId: caso.clientId,
        ...(parsed.data.status ? { novoStatus: parsed.data.status } : {}),
      },
    })

    return NextResponse.json({ case: mapCaseToApi(caso) })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      select: { benefitType: true, client: { select: { name: true } }, clientId: true, googleCalendarEventId: true },
    })

    if (caso?.googleCalendarEventId) {
      await deleteCalendarEvent(session.user.id, caso.googleCalendarEventId)
    }

    await prisma.case.delete({ where: { id: params.id } })

    if (caso) {
      await logAudit({
        userId: session.user.id,
        action: 'case.deleted',
        resource: `Caso (${caso.benefitType.replace(/_/g, ' ')}) - ${caso.client?.name ?? 'Cliente'}`,
        req,
        metadata: { caseId: params.id, clientId: caso.clientId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
