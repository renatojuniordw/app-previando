import { prisma } from './prisma'
import { NotFoundError } from './api-error'

// Sempre retorna 404 (não 403) — não vaza existência do recurso (anti-IDOR)

export async function verifyCaseOwnership(caseId: string, userId: string): Promise<void> {
  const c = await prisma.case.findFirst({
    where: { id: caseId, userId },
    select: { id: true },
  })
  if (!c) throw new NotFoundError()
}

export async function verifyClientOwnership(clientId: string, userId: string): Promise<void> {
  const c = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  })
  if (!c) throw new NotFoundError()
}
