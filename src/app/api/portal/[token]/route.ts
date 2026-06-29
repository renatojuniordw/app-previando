import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import type { PortalConfig } from '@/app/api/cases/[id]/portal/config/route'

/**
 * GET /api/portal/[token]
 * Endpoint público — sem autenticação.
 * Retorna dados do caso para exibição no Portal do Cliente.
 * Respeita portalConfig — só expõe o que o advogado autorizou.
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const access = await prisma.clientAccess.findUnique({
      where: { token: params.token },
      include: {
        case: {
          include: {
            client: { select: { name: true, birthDate: true } },
            calculations: {
              where: { isSelected: true },
              select: {
                modality: true,
                rmi: true,
                rma: true,
                benefitSalary: true,
                eligible: true,
                expectedDib: true,
                contributionTime: true,
              },
            },
            retroactives: {
              select: {
                entitlementStartDate: true,
                requestDate: true,
                monthsLate: true,
                totalGrossValue: true,
                totalCorrectedValue: true,
                finalNetValue: true,
                correctionIndex: true,
              },
            },
            user: { select: { name: true, oabNumber: true, plan: true } },
          },
        },
      },
    })

    if (!access) {
      return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 })
    }

    if (access.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Este link expirou.' }, { status: 410 })
    }

    const { case: c } = access
    const hasWatermark = c.user.plan === 'FREE'

    // Lê a config do portal — o advogado decide o que o cliente vê
    const caso = c as unknown as { portalConfig: PortalConfig }
    const portalConfig = caso.portalConfig ?? {
      showProcessTracking: true,
      showCalculations: true,
      showRetroactives: false,
      showInterpretation: false,
    }

    // Monta resposta respeitando a config — spreads condicionais (sem mutation)
    return NextResponse.json({
      hasWatermark,
      portalConfig,
      lawyer: {
        name: c.user.name,
        oabNumber: c.user.oabNumber,
      },
      client: {
        name: c.client.name,
        birthDate: c.client.birthDate,
      },
      case: {
        id: c.id,
        status: c.status,
        benefitType: c.benefitType,
        createdAt: c.createdAt,
        ...(portalConfig.showProcessTracking && { processNumber: c.processNumber }),
      },
      ...(portalConfig.showProcessTracking && {
        processTracking: {
          processNumber: c.processNumber,
          processLastCheck: c.processLastCheck?.toISOString() ?? null,
          processLastMovDate: c.processLastMovDate?.toISOString() ?? null,
          processLastMovCount: c.processLastMovCount,
          processLastSummary: c.processLastSummary,
        },
      }),
      ...(portalConfig.showCalculations && { calculations: c.calculations }),
      ...(portalConfig.showRetroactives && { retroactives: c.retroactives }),
      expiresAt: access.expiresAt,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
