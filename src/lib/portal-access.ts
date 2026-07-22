import { prisma } from '@/lib/prisma'
import { hashPortalToken } from '@/lib/portal-session'
import type { Prisma } from '@prisma/client'

export interface PortalAccessResult {
  access: {
    id: string
    caseId: string
    userId: string
    token: string
    tokenHash: string
    expiresAt: Date
    createdAt: Date
    case: {
      id: string
      status: string
      benefitType: string
      createdAt: Date
      notes: string | null
      deadlineDate: Date | null
      deadlineDays: number | null
      portalConfig: Prisma.JsonValue
      client: { name: string; birthDate: Date }
      user: { name: string | null; oabNumber: string | null; plan: string }
    }
  }
}

/**
 * Busca o acesso do portal pelo token com hash seguro.
 * Retorna null se o token for inválido ou expirado.
 * Compartilhado entre todas as rotas do portal — elimina duplicação.
 */
export async function getPortalAccess(token: string): Promise<PortalAccessResult['access'] | null> {
  const tokenHash = hashPortalToken(token)

  const access = await prisma.clientAccess.findUnique({
    where: { tokenHash },
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

  if (!access) return null
  if (access.expiresAt < new Date()) return null

  return access as PortalAccessResult['access']
}
