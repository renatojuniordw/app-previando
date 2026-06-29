import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

/**
 * GET /api/portal/[token]
 * Endpoint público — sem autenticação.
 * Retorna dados do caso para exibição no Portal do Cliente.
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

    return NextResponse.json({
      hasWatermark,
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
        processNumber: c.processNumber,
        createdAt: c.createdAt,
      },
      calculations: c.calculations,
      retroactives: c.retroactives,
      expiresAt: access.expiresAt,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
