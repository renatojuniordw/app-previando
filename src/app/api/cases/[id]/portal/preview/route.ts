import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import type { PortalConfig } from '@/lib/portal-config'

/**
 * POST /api/cases/[id]/portal/preview
 * Autenticado (dono do caso). Retorna os dados como o cliente veria o
 * portal, aplicando a config em rascunho enviada no body (não precisa
 * estar salva ainda) — usado pelo botão "Ver como o cliente vê".
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const draftConfig = (await req.json()) as Partial<PortalConfig>

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { name: true, birthDate: true } },
        calculations: {
          where: { isSelected: true },
          orderBy: { rmi: 'desc' },
        },
        retroactives: { orderBy: { createdAt: 'desc' }, take: 1 },
        bpcAnalysis: true,
      },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })

    return NextResponse.json({
      client: caso.client,
      benefitType: caso.benefitType,
      calculations: draftConfig.showCalculations
        ? caso.calculations.map((c) => ({
            ...c,
            rmi: Number(c.rmi),
            rma: Number(c.rma),
            benefitSalary: Number(c.benefitSalary),
          }))
        : [],
      retroactives: draftConfig.showRetroactives
        ? caso.retroactives.map((r) => ({
            ...r,
            totalGrossValue: Number(r.totalGrossValue),
            totalCorrectedValue: Number(r.totalCorrectedValue),
            finalNetValue: Number(r.finalNetValue),
          }))
        : [],
      bpcAnalysis:
        draftConfig.showBpcSocialAnalysis && caso.bpcAnalysis
          ? {
              ...caso.bpcAnalysis,
              rendaFamiliar: Number(caso.bpcAnalysis.rendaFamiliar),
              rendaPerCapita: Number(caso.bpcAnalysis.rendaPerCapita),
            }
          : null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
