import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'

const createSchema = z.object({
  dataInicioDireito: z.string().datetime(),
  dataRequerimento: z.string().datetime(),
  mesesAtraso: z.number().int().positive(),
  valorMensalBruto: z.number().positive(),
  valorTotalBruto: z.number().positive(),
  valorTotalCorrigido: z.number().positive(),
  indiceCorrecao: z.string(),
  valorDescontos: z.number().default(0),
  descricaoDescontos: z.string().optional(),
  valorLiquidoFinal: z.number().positive(),
  memoriaCalculo: z.record(z.unknown()),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const retroativos = await prisma.retroativo.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ retroativos })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await guardFeature(session.user.plan, 'RETROATIVOS')
    await verifyCaseOwnership(params.id, session.user.id)

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    const retroativo = await prisma.retroativo.create({
      data: {
        caseId: params.id,
        dataInicioDireito: new Date(parsed.data.dataInicioDireito),
        dataRequerimento: new Date(parsed.data.dataRequerimento),
        mesesAtraso: parsed.data.mesesAtraso,
        valorMensalBruto: parsed.data.valorMensalBruto,
        valorTotalBruto: parsed.data.valorTotalBruto,
        valorTotalCorrigido: parsed.data.valorTotalCorrigido,
        indiceCorrecao: parsed.data.indiceCorrecao,
        valorDescontos: parsed.data.valorDescontos,
        descricaoDescontos: parsed.data.descricaoDescontos ?? null,
        valorLiquidoFinal: parsed.data.valorLiquidoFinal,
        memoriaCalculo: parsed.data.memoriaCalculo as never,
      },
    })

    return NextResponse.json({ retroativo }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
