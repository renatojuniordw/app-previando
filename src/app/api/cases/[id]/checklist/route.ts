import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

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

    return NextResponse.json({ checklist })
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
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    const checklist = await prisma.checklist.create({
      data: {
        caseId: params.id,
        benefitType: parsed.data.benefitType,
        items: parsed.data.items,
        eligible: parsed.data.eligible,
        pendencias: parsed.data.pendencias,
      },
    })

    return NextResponse.json({ checklist }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
