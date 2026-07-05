export const FEE_STATUSES = ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'] as const
export type FeeStatusValue = (typeof FEE_STATUSES)[number]

export const FEE_TYPES = ['FIXED', 'CONTINGENCY', 'PERCENTAGE', 'OTHER'] as const
export type FeeTypeValue = (typeof FEE_TYPES)[number]

/**
 * Deriva o status do honorário a partir dos valores e do vencimento.
 * CANCELLED é a única transição manual — uma vez cancelado, o status
 * só muda se o usuário reverter a marcação explicitamente.
 */
export function computeFeeStatus(params: {
  totalAmount: number
  paidAmount: number
  dueDate: Date | null
  cancelled?: boolean
}): FeeStatusValue {
  if (params.cancelled) return 'CANCELLED'

  const isOverdue = !!params.dueDate && params.dueDate.getTime() < Date.now()

  if (params.totalAmount > 0 && params.paidAmount >= params.totalAmount) return 'PAID'
  if (params.paidAmount > 0) return isOverdue ? 'OVERDUE' : 'PARTIAL'
  return isOverdue ? 'OVERDUE' : 'PENDING'
}
