import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError, ValidationError } from '@/lib/api-error'
import { computeFeeStatus } from '@/lib/fee-status'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; feeId: string; paymentId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const fee = await prisma.fee.findFirst({ where: { id: params.feeId, caseId: params.id } })
    if (!fee) throw new ValidationError('Honorário não encontrado.')

    const payment = await prisma.feePayment.findFirst({
      where: { id: params.paymentId, feeId: params.feeId },
    })
    if (!payment) throw new ValidationError('Pagamento não encontrado.')

    const totalAmount = Number(fee.totalAmount)
    const newPaidAmount = Number(fee.paidAmount) - Number(payment.amount)

    const updated = await prisma.$transaction(async (tx) => {
      await tx.feePayment.delete({ where: { id: payment.id } })
      return tx.fee.update({
        where: { id: fee.id },
        data: {
          paidAmount: newPaidAmount,
          status: computeFeeStatus({
            totalAmount,
            paidAmount: newPaidAmount,
            dueDate: fee.dueDate,
            cancelled: fee.status === 'CANCELLED',
          }),
        },
        include: { payments: { orderBy: { paidAt: 'desc' } } },
      })
    })

    return NextResponse.json({ fee: updated })
  } catch (err) {
    return handleApiError(err)
  }
}
