import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature, guardBpcAnalysisLimit } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { z } from 'zod'

const BpcSchema = z.object({
  patologia: z.string().min(1).max(500),
  cid: z.string().max(50).optional(),
  idade: z.number().int().positive(),
  faixaEtaria: z.enum(['MENOR_16', 'MAIOR_16']),
  rendaFamiliar: z.number().positive(),
  membrosGrupo: z.number().int().positive(),
  rendaPerCapita: z.number().positive(),
  barreirasRelatadas: z.string().max(5000),
  resumoLaudos: z.string().max(10000).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const analysis = await prisma.bpcAnalysis.findUnique({
      where: { caseId: params.id },
    })

    if (!analysis) return NextResponse.json({ error: 'Nenhuma análise BPC encontrada para este caso.' }, { status: 404 })

    return NextResponse.json(analysis)
  } catch (err: any) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await guardFeature(session.user.plan, 'USE_BPC_MODULE')
    await guardBpcAnalysisLimit(session.user.id, session.user.plan)
    await verifyCaseOwnership(params.id, session.user.id)

    const body = await req.json()
    const { barreirasRelatadas, ...rest } = BpcSchema.parse(body)

    const analysis = await prisma.bpcAnalysis.upsert({
      where: { caseId: params.id },
      update: { ...rest, barreiras: barreirasRelatadas },
      create: { ...rest, barreiras: barreirasRelatadas, caseId: params.id },
    })

    await prisma.usageRecord.upsert({
      where: { userId: session.user.id },
      update: { bpcAnalysesThisMonth: { increment: 1 } },
      create: { userId: session.user.id, bpcAnalysesThisMonth: 1 },
    })

    return NextResponse.json(analysis)
  } catch (err: any) {
    return handleApiError(err)
  }
}
