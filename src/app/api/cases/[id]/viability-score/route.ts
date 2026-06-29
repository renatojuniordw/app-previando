import { NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { calcularViabilityScore } from '@/lib/viability-score'
import { getSalarioVigente } from '@/lib/salario-minimo'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)
    await guardFeature(session.user.plan, 'VIABILITY_SCORE')

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { birthDate: true } },
        cnisDocument: { select: { extractedData: true } },
      },
    })

    if (!caso) {
      return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })
    }

    const caseData = caso as unknown as {
      createdAt: Date
      client: { birthDate: Date } | null
      cnisDocument: { extractedData: unknown } | null
    }

    if (!caseData.client?.birthDate) {
      return NextResponse.json({ error: 'Cliente sem data de nascimento.' }, { status: 400 })
    }

    const dib = caseData.createdAt.toISOString().slice(0, 10)
    const { valor: salarioMinimo, teto } = await getSalarioVigente(dib)

    const result = calcularViabilityScore({
      birthDate: caseData.client.birthDate.toISOString().slice(0, 10),
      gender: 'M',
      dib,
      extractedData: caseData.cnisDocument?.extractedData as any ?? null,
      salarioMinimo,
      tetoPrevidenciario: teto,
    })

    return NextResponse.json({ ...result, generatedAt: new Date().toISOString() })
  } catch (err) {
    return handleApiError(err)
  }
}
