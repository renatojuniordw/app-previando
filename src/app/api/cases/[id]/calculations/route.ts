import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardCalculationLimit } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'

const createSchema = z.object({
  modalidade: z.enum([
    'PONTOS_86_96', 'PEDAGIO_50', 'PEDAGIO_100', 'IDADE_MINIMA_65_62',
    'TEMPO_CONTRIBUICAO', 'APOSENTADORIA_IDADE', 'APOSENTADORIA_ESPECIAL',
    'HIBRIDA', 'AUXILIO_DOENCA_B31', 'AUXILIO_DOENCA_B91',
    'SALARIO_MATERNIDADE', 'AUXILIO_RECLUSAO', 'PENSAO_MORTE', 'BPC_LOAS',
  ]),
  inputParams: z.record(z.unknown()),
  salarioBeneficio: z.number(),
  rmi: z.number(),
  rma: z.number(),
  fatorPrevidenciario: z.number().optional(),
  coeficiente: z.number().optional(),
  dibPrevista: z.string().datetime().optional(),
  carenciaAtendida: z.boolean().default(false),
  tempoContribuicao: z.number().int().optional(),
  idadeNaApuracao: z.number().int().optional(),
  elegivel: z.boolean().default(false),
  pendencias: z.array(z.string()).default([]),
  memoriaCalculo: z.record(z.unknown()),
  periodosSalarios: z.record(z.unknown()),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const calculations = await prisma.calculation.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ calculations })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)
    await guardCalculationLimit(session.user.id, session.user.plan)

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    const calc = await prisma.calculation.create({
      data: {
        caseId: params.id,
        modalidade: parsed.data.modalidade,
        inputParams: parsed.data.inputParams as never,
        salarioBeneficio: parsed.data.salarioBeneficio,
        rmi: parsed.data.rmi,
        rma: parsed.data.rma,
        fatorPrevidenciario: parsed.data.fatorPrevidenciario ?? null,
        coeficiente: parsed.data.coeficiente ?? null,
        dibPrevista: parsed.data.dibPrevista ? new Date(parsed.data.dibPrevista) : null,
        carenciaAtendida: parsed.data.carenciaAtendida,
        tempoContribuicao: parsed.data.tempoContribuicao ?? null,
        idadeNaApuracao: parsed.data.idadeNaApuracao ?? null,
        elegivel: parsed.data.elegivel,
        pendencias: parsed.data.pendencias,
        memoriaCalculo: parsed.data.memoriaCalculo as never,
        periodosSalarios: parsed.data.periodosSalarios as never,
      },
    })

    // Incrementa contador mensal
    await prisma.usageRecord.update({
      where: { userId: session.user.id },
      data: { calculationsThisMonth: { increment: 1 } },
    })

    return NextResponse.json({ calculation: calc }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
