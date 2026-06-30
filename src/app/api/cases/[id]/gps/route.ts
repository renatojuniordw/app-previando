import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { calcularContribuicao, getCategorias } from '@/lib/gps-engine'
import { getSalarioVigente } from '@/lib/salario-minimo'

const gpsSchema = z.object({
  categoria: z.enum(['CI', 'FACULTATIVO', 'MEI', 'SEGURADO_ESPECIAL']),
  plano: z.enum(['NORMAL', 'SIMPLIFICADO', 'BAIXA_RENDA']),
  salarioContribuicao: z.number().positive('Salário de contribuição deve ser positivo'),
  competencia: z.string().regex(/^\d{4}-\d{2}$/, 'Formato inválido (YYYY-MM)'),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const [guias, categorias] = await Promise.all([
      prisma.gpsGuide.findMany({
        where: { caseId: params.id },
        orderBy: { createdAt: 'desc' },
      }),
      Promise.resolve(getCategorias()),
    ])

    return NextResponse.json({
      guias: guias.map((g) => ({
        id: g.id,
        categoria: g.categoria,
        plano: g.plano,
        salarioContribuicao: Number(g.salarioContribuicao),
        valorCalculado: Number(g.valorCalculado),
        aliquota: g.aliquota,
        codigoPagamento: g.codigoPagamento,
        competencia: g.competencia,
        pdfUrl: g.pdfUrl,
        createdAt: g.createdAt,
      })),
      categorias,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)
    await guardFeature(session.user.plan, 'GPS_MODULE')

    const limit = await rateLimit(`gps:${session.user.id}`, 20, 3600)
    if (!limit.success) {
      return NextResponse.json({ error: 'Limite de requisições atingido. Tente novamente mais tarde.' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = gpsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', detalhes: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { categoria, plano, salarioContribuicao, competencia } = parsed.data

    const { valor: salarioMinimo, teto } = await getSalarioVigente(competencia + '-01')

    const result = calcularContribuicao({
      categoria,
      plano,
      salarioContribuicao,
      competencia,
      salarioMinimo,
      tetoPrevidenciario: teto,
    })

    const guia = await prisma.gpsGuide.create({
      data: {
        caseId: params.id,
        categoria: result.categoria,
        plano: result.plano,
        salarioContribuicao: result.salarioContribuicao,
        valorCalculado: result.valorCalculado,
        aliquota: result.aliquota,
        codigoPagamento: result.codigoPagamento,
        competencia: result.competencia,
      },
    })

    return NextResponse.json({
      ...result,
      id: guia.id,
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
