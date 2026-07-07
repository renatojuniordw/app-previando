import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import { guardPeticaoLimit, tryConsumeMonthlyUsage } from '@/lib/plan-guard'
import { generatePeticao } from '@/services/peticao-generator'
import { BENEFIT_LABELS } from '@/lib/constants'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnershipAndActive(params.id, session.user.id)

    await guardPeticaoLimit(session.user.id, session.user.plan)

    const limit = await rateLimit(`peticao:${session.user.id}`, 10, 3600)
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Limite de petições por hora atingido. Tente mais tarde.' },
        { status: 429 }
      )
    }

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { name: true, birthDate: true, cpfHash: true, maritalStatus: true, profession: true, city: true, cnisDocument: { select: { markdownContent: true } } } },
        user: { select: { name: true, oabNumber: true, maritalStatus: true, profession: true, city: true } },
        calculations: {
          where: { isSelected: true },
          take: 1,
        },
        retroactives: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })
    if (!caso.calculations.length) {
      return NextResponse.json({ error: 'Selecione um cálculo como definitivo antes de gerar a petição.' }, { status: 400 })
    }

    const calc = caso.calculations[0]
    const retroativo = caso.retroactives[0]

    const result = await generatePeticao({
      clientName: caso.client?.name ?? 'Cliente',
      clientCpf: `XXX.${(caso.client?.cpfHash ?? '').slice(0, 3)}.XXX-XX`,
      clientBirthDate: caso.client?.birthDate?.toISOString().split('T')[0] ?? '',
      clientMaritalStatus: caso.client?.maritalStatus,
      clientProfession: caso.client?.profession,
      clientCity: caso.client?.city,
      benefitType: caso.benefitType,
      benefitTypeLabel: BENEFIT_LABELS[caso.benefitType] ?? caso.benefitType,
      lawyerName: caso.user.name ?? 'Advogado',
      lawyerOab: caso.user.oabNumber,
      cnisSummary: caso.client?.cnisDocument?.markdownContent ?? undefined,
      calculation: {
        modalidade: calc.modality,
        rmi: Number(calc.rmi),
        rma: Number(calc.rma),
        salarioBeneficio: Number(calc.benefitSalary),
        elegivel: calc.eligible,
        tempoContribuicao: calc.contributionTime ?? 0,
        idadeNaApuracao: calc.ageAtCalculation ?? 0,
      },
      retroativoTotal: retroativo?.finalNetValue != null ? Number(retroativo.finalNetValue) : undefined,
    })

    await tryConsumeMonthlyUsage(session.user.id, session.user.plan, 'peticoesThisMonth')

    return NextResponse.json({
      content: result.content,
      tokensUsed: result.tokensUsed,
      costUsd: result.costUsd,
      model: result.model,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
