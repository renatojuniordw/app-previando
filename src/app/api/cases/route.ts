import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyClientOwnership } from '@/lib/ownership'
import { sanitizeInput } from '@/lib/sanitize'
import { handleApiError } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import { CaseStatus as DbCaseStatus } from '@prisma/client'
import {
  mapCaseStatusToDb,
  mapBenefitTypeToDb,
  mapCaseToApi,
  ApiCaseStatus,
  ApiBenefitType,
} from '@/lib/mappers'

const createSchema = z.object({
  clientId: z.string().cuid(),
  benefitType: z.enum([
    'APOSENTADORIA_IDADE',
    'APOSENTADORIA_TEMPO_CONTRIBUICAO',
    'APOSENTADORIA_ESPECIAL',
    'APOSENTADORIA_HIBRIDA',
    'APOSENTADORIA_PONTOS',
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

    const [cases, total] = await prisma.$transaction([
      prisma.case.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { deadlineDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          client: { select: { id: true, name: true, phone: true } },
          cnisDocument: { select: { processingStatus: true } },
          calculations: { select: { id: true, isSelected: true, rmi: true }, orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.case.count({ where }),
    ])

    const mapped = cases.map((c) => ({
      ...mapCaseToApi(c),
      selectedRmi: c.calculations.find((calc) => calc.isSelected)?.rmi ?? null,
    }))

    return NextResponse.json({ cases: mapped, total, page, limit })
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

    await verifyClientOwnership(parsed.data.clientId, session.user.id)

    const caso = await prisma.case.create({
      data: {
        userId: session.user.id,
        clientId: parsed.data.clientId,
        benefitType: mapBenefitTypeToDb(parsed.data.benefitType as ApiBenefitType),
        priority: parsed.data.priority,
        deadlineDays: parsed.data.deadlineDays ?? null,
        deadlineDate: parsed.data.deadlineDate ? new Date(parsed.data.deadlineDate) : null,
        notes: parsed.data.notes ? sanitizeInput(parsed.data.notes) : null,
        status: DbCaseStatus.PROSPECTING,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ case: mapCaseToApi(caso) }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
