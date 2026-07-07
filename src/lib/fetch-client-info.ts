import { prisma } from './prisma'
import type { ClientInfo } from './pdf-generator'

export async function fetchClientInfo(caseId: string, userId: string): Promise<ClientInfo | null> {
  const caseData = await prisma.case.findFirst({
    where: { id: caseId, userId },
    select: {
      client: {
        select: {
          name: true,
          birthDate: true,
          phone: true,
          email: true,
          maritalStatus: true,
          profession: true,
          street: true,
          streetNumber: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
        },
      },
    },
  })

  const c = caseData?.client
  if (!c) return null

  const addressParts = [c.street, c.streetNumber, c.complement, c.neighborhood, c.city, c.state, c.zipCode]
    .filter(Boolean)

  return {
    name: c.name,
    birthDate: c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : undefined,
    phone: c.phone ?? undefined,
    email: c.email ?? undefined,
    maritalStatus: c.maritalStatus ?? undefined,
    profession: c.profession ?? undefined,
    address: addressParts.length > 0 ? addressParts.join(', ') : undefined,
  }
}
