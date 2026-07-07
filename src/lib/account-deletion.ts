import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { mpPreApproval } from '@/services/mercadopago'
import { deleteObjectsByPrefix } from '@/services/r2'
import { Logger } from '@/lib/logger'

const logger = new Logger('AccountDeletion')

/**
 * Exclui/anonimiza uma conta de usuário (LGPD Art. 18, VI):
 * - Cancela assinatura ativa no Mercado Pago (evita cobrança pós-exclusão).
 * - Remove arquivos do R2 (CNIS + documentos).
 * - Apaga em cascata os dados de negócio (clients → cases → cálculos, etc.).
 * - Anonimiza a linha do User em vez de deletá-la, preservando o vínculo
 *   com Payment (retenção fiscal de 5 anos) e AuditLog (trilha de auditoria).
 * - Invalida sessões JWT existentes via passwordChangedAt (ver src/lib/auth-server.ts).
 */
export async function deleteAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { mpSubscriptionId: true, mpSubscriptionStatus: true },
  })

  if (user.mpSubscriptionId && user.mpSubscriptionStatus !== 'cancelled') {
    try {
      await mpPreApproval.update({ id: user.mpSubscriptionId, body: { status: 'cancelled' } })
    } catch (err) {
      logger.warn('Falha ao cancelar assinatura no Mercado Pago durante exclusão de conta', { userId, err })
    }
  }

  await Promise.allSettled([
    deleteObjectsByPrefix(`cnis/${userId}/`),
    deleteObjectsByPrefix(`documents/${userId}/`),
  ])

  const now = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.client.deleteMany({ where: { userId } })
    await tx.account.deleteMany({ where: { userId } })
    await tx.session.deleteMany({ where: { userId } })
    await tx.notification.deleteMany({ where: { userId } })
    await tx.clientAccess.deleteMany({ where: { userId } })
    await tx.document.deleteMany({ where: { userId } })
    await tx.usageRecord.deleteMany({ where: { userId } })

    await tx.user.update({
      where: { id: userId },
      data: {
        name: 'Usuário Excluído',
        email: `deleted-${userId}@anon.previando.com.br`,
        password: null,
        image: null,
        emailVerified: null,
        cpf: null,
        oabNumber: null,
        phone: null,
        maritalStatus: null,
        profession: null,
        street: null,
        streetNumber: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        zipCode: null,
        mpCustomerId: null,
        mpSubscriptionId: null,
        mpSubscriptionStatus: null,
        plan: 'FREE',
        planStatus: 'CANCELLED',
        deletedAt: now,
        passwordChangedAt: now,
      },
    })
  })

  await logAudit({ userId, action: 'account.deleted', resource: 'user' })
}
