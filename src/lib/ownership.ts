import { prisma } from './prisma'
import { NotFoundError, PlanLimitError } from './api-error'

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

// Cliente com `active: false` excedeu o limite de clientes do plano atual
// após um downgrade — fica em modo somente-leitura até o usuário liberar
// espaço (desativar/excluir outro cliente) ou fazer upgrade.
export function assertClientActive(client: { active: boolean }): void {
  if (!client.active) {
    throw new PlanLimitError(
      'Este cliente está bloqueado por exceder o limite de clientes do seu plano. Ative outro cliente na listagem, exclua algum ou faça upgrade.',
      'CLIENT_OVER_LIMIT',
      'SOLO'
    )
  }
}

export async function verifyClientOwnershipAndActive(clientId: string, userId: string): Promise<void> {
  const c = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true, active: true },
  })
  if (!c) throw new NotFoundError()
  assertClientActive(c)
}

// Mesma checagem de posse de `verifyCaseOwnership`, mas também bloqueia
// escrita se o cliente do caso está inativo (excedente de plano).
export async function verifyCaseOwnershipAndActive(caseId: string, userId: string): Promise<void> {
  const c = await prisma.case.findFirst({
    where: { id: caseId, userId },
    select: { id: true, client: { select: { active: true } } },
  })
  if (!c) throw new NotFoundError()
  assertClientActive(c.client)
}
