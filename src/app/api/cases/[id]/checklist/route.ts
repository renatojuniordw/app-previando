import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { mapBenefitTypeToDb, mapBenefitTypeToApi, ApiBenefitType } from '@/lib/mappers'

const createSchema = z.object({
  benefitType: z.enum([
    'APOSENTADORIA_IDADE', 'APOSENTADORIA_TEMPO_CONTRIBUICAO', 'APOSENTADORIA_ESPECIAL',
    'APOSENTADORIA_HIBRIDA', 'APOSENTADORIA_PONTOS', 'AUXILIO_DOENCA', 'AUXILIO_ACIDENTE',
    'SALARIO_MATERNIDADE', 'AUXILIO_RECLUSAO', 'PENSAO_POR_MORTE', 'BPC_LOAS', 'REVISAO_BENEFICIO',
  ]),
  items: z.array(z.object({
    id: z.string(),
    label: z.string(),
    checked: z.boolean(),
    required: z.boolean().default(true),
  })),
  eligible: z.boolean(),
  pendencias: z.array(z.string()).default([]),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const checklist = await prisma.checklist.findFirst({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    if (!checklist) return NextResponse.json({ checklist: null })

    return NextResponse.json({
      checklist: {
        id: checklist.id,
        caseId: checklist.caseId,
        benefitType: mapBenefitTypeToApi(checklist.benefitType),
        items: checklist.items,
        eligible: checklist.eligible,
        pendencias: checklist.pendingIssues,
        createdAt: checklist.createdAt,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const body = await req.json()
    const itemsSchema = z.array(z.object({
      id: z.string(),
      label: z.string(),
      checked: z.boolean(),
      required: z.boolean(),
    }))
    const parsed = itemsSchema.safeParse(body.items)
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const checklist = await prisma.checklist.findFirst({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })
    if (!checklist) return NextResponse.json({ error: 'Checklist não encontrado.' }, { status: 404 })

    const updated = await prisma.checklist.update({
      where: { id: checklist.id },
      data: { items: parsed.data },
    })

    return NextResponse.json({ checklist: { id: updated.id, items: updated.items } })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const checklist = await prisma.checklist.create({
      data: {
        caseId: params.id,
        benefitType: mapBenefitTypeToDb(parsed.data.benefitType as ApiBenefitType),
        items: parsed.data.items,
        eligible: parsed.data.eligible,
        pendingIssues: parsed.data.pendencias,
      },
    })

    return NextResponse.json({
      checklist: {
        id: checklist.id,
        caseId: checklist.caseId,
        benefitType: mapBenefitTypeToApi(checklist.benefitType),
        items: checklist.items,
        eligible: checklist.eligible,
        pendencias: checklist.pendingIssues,
        createdAt: checklist.createdAt,
      },
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
