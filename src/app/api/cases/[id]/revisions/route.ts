import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardRevisionLimit, incrementRevisionUsage } from '@/lib/plan-guard'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { runAndSaveRevision } from '@/services/revision-service'

const createRevisionSchema = z.object({
  tipoRevisao: z.enum(['REVISAO_VIDA_TODA', 'REVISAO_ART_29', 'REVISAO_BURACO_NEGRO']),
  rmiConcedido: z.number().positive('RMI concedido deve ser positivo'),
  dibConcedido: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)'),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const revisions = await prisma.revision.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = revisions.map((r) => ({
      id: r.id,
      tipoRevisao: r.tipoRevisao,
      rmiConcedido: Number(r.rmiConcedido),
      rmiRevisado: Number(r.rmiRevisado),
      diferencaMensal: Number(r.diferencaMensal),
      diferencaPercentual: r.diferencaPercentual,
      retroativos5Anos: Number(r.retroativos5Anos),
      elegivel: r.elegivel,
      pendencias: r.pendencias,
      createdAt: r.createdAt,
    }))

    return NextResponse.json({ revisions: formatted })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)
    await guardRevisionLimit(session.user.id, session.user.plan)

    const limit = await rateLimit(`revision:${session.user.id}`, 10, 3600)
    if (!limit.success) {
      return NextResponse.json({ error: 'Limite de requisições atingido. Tente novamente mais tarde.' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = createRevisionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', detalhes: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { tipoRevisao, rmiConcedido, dibConcedido } = parsed.data

    const result = await runAndSaveRevision({
      caseId: params.id,
      userId: session.user.id,
      tipoRevisao,
      rmiConcedido,
      dibConcedido,
    })

    await incrementRevisionUsage(session.user.id)

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
