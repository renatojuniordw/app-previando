import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifyClientOwnershipAndActive } from '@/lib/ownership'
import { sanitizeInput } from '@/lib/sanitize-server'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { CaseStatus as DbCaseStatus } from '@prisma/client'
import {
  mapCaseStatusToDb,
  mapBenefitTypeToDb,
  mapCaseToApi,
  ApiCaseStatus,
  ApiBenefitType,
} from '@/lib/mappers'
import { createCalendarEvent } from '@/services/google-calendar'

function buildOrderBy(sortField: string | null, sortDir: 'asc' | 'desc'): Prisma.CaseOrderByWithRelationInput[] {
  if (!sortField) {
    return [{ priority: 'asc' }, { deadlineDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }]
  }
  switch (sortField) {
    case 'client':
      return [{ client: { name: sortDir } }]
    case 'status':
      return [{ status: sortDir }]
    case 'priority':
      return [{ priority: sortDir }]
    case 'deadlineDate':
      return [{ deadlineDate: { sort: sortDir, nulls: 'last' } }]
    case 'createdAt':
      return [{ createdAt: sortDir }]
    default:
      return [{ createdAt: 'desc' }]
  }
}

const createSchema = z.object({
  clientId: z.string().cuid(),
  benefitType: z.enum([
    'APOSENTADORIA_IDADE',
    'APOSENTADORIA_TEMPO_CONTRIBUICAO',
    'APOSENTADORIA_ESPECIAL',
    'APOSENTADORIA_HIBRIDA',
    'APOSENTADORIA_PONTOS',
    'APOSENTADORIA_PCD',
    'AUXILIO_DOENCA',
    'AUXILIO_ACIDENTE',
    'SALARIO_MATERNIDADE',
    'AUXILIO_RECLUSAO',
    'PENSAO_POR_MORTE',
    'BPC_LOAS',
    'REVISAO_BENEFICIO',
  ]),
  priority: z.enum(['CRITICAL', 'ATTENTION', 'NORMAL']).default('NORMAL'),
  deadlineDays: z.number().int().positive().optional(),
  deadlineDate: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { success } = await rateLimit(`cases:list:${session.user.id}`, 60, 60)
    if (!success) return NextResponse.json({ error: 'Muitas requisições. Tente novamente mais tarde.' }, { status: 429 })

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const priority = searchParams.get('priority')
    const benefitType = searchParams.get('benefitType')
    const search = searchParams.get('search')
    const rmiMin = searchParams.get('rmiMin')
    const rmiMax = searchParams.get('rmiMax')
    const createdFrom = searchParams.get('createdFrom')
    const createdTo = searchParams.get('createdTo')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const skip = (page - 1) * limit
    const sortField = searchParams.get('sortField')
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc'

    const where: Record<string, unknown> = { userId: session.user.id }
    if (status) where.status = mapCaseStatusToDb(status as ApiCaseStatus)
    if (clientId) where.clientId = clientId
    if (priority && ['CRITICAL', 'ATTENTION', 'NORMAL'].includes(priority)) where.priority = priority
    if (benefitType) where.benefitType = mapBenefitTypeToDb(benefitType as ApiBenefitType)
    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
        ...(createdTo ? { lte: new Date(createdTo) } : {}),
      }
    }
    if (search) {
      const q = sanitizeInput(search).slice(0, 100)
      where.client = { name: { contains: q, mode: 'insensitive' } }
    }
    if (rmiMin || rmiMax) {
      where.calculations = {
        some: {
          isSelected: true,
          rmi: {
            ...(rmiMin ? { gte: parseFloat(rmiMin) } : {}),
            ...(rmiMax ? { lte: parseFloat(rmiMax) } : {}),
          },
        },
      }
    }

    const orderBy = buildOrderBy(sortField, sortDir)

    const [cases, total] = await prisma.$transaction([
      prisma.case.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          client: { select: { id: true, name: true, phone: true, cnisDocument: { select: { processingStatus: true } } } },
          calculations: {
            where: { isSelected: true },
            select: { id: true, modality: true, rmi: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.case.count({ where }),
    ])

    const mapped = cases.map((c) => ({
      ...mapCaseToApi(c),
      cnisDocument: c.client.cnisDocument,
      selectedRmi: c.calculations[0]?.rmi ?? null,
    }))

    return NextResponse.json({ cases: mapped, total, page, limit }, {
      headers: { 'Cache-Control': 'private, max-age=0, stale-while-revalidate=30' },
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const limit = await rateLimit(`sensitive:${session.user.id}`, 30, 60)
    if (!limit.success) return NextResponse.json({ error: 'Limite de operações atingido.' }, { status: 429 })

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
    }

    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    await verifyClientOwnershipAndActive(parsed.data.clientId, session.user.id)

    const deadlineDate = parsed.data.deadlineDate ? new Date(parsed.data.deadlineDate) : null

    const caso = await prisma.case.create({
      data: {
        userId: session.user.id,
        clientId: parsed.data.clientId,
        benefitType: mapBenefitTypeToDb(parsed.data.benefitType as ApiBenefitType),
        priority: parsed.data.priority,
        deadlineDays: parsed.data.deadlineDays ?? null,
        deadlineDate,
        notes: parsed.data.notes ? sanitizeInput(parsed.data.notes) : null,
        status: DbCaseStatus.PROSPECTING,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    })

    if (deadlineDate) {
      const calendarEventId = await createCalendarEvent(session.user.id, {
        title: `Prazo: ${caso.client?.name ?? 'Cliente'} — ${caso.benefitType.replace(/_/g, ' ')}`,
        description: parsed.data.notes ?? undefined,
        date: deadlineDate,
      })
      if (calendarEventId) {
        await prisma.case.update({
          where: { id: caso.id },
          data: { googleCalendarEventId: calendarEventId },
        })
      }
    }

    await logAudit({
      userId: session.user.id,
      action: 'case.created',
      resource: `Caso (${caso.benefitType.replace(/_/g, ' ')}) - ${caso.client?.name ?? 'Cliente'}`,
      req,
      metadata: { caseId: caso.id, clientId: caso.clientId },
    })

    return NextResponse.json({ case: mapCaseToApi(caso) }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
