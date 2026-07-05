import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError, ValidationError } from '@/lib/api-error'
import { computeFeeStatus } from '@/lib/fee-status'

const createSchema = z.object({
  amount: z.number().positive(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional().nullable(),
})

async function loadFee(feeId: string, caseId: string) {
  const fee = await prisma.fee.findFirst({ where: { id: feeId, caseId } })
  if (!fee) throw new ValidationError('Honorário não encontrado.')
  return fee
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; feeId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)
    const fee = await loadFee(params.feeId, params.id)

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    const { amount, paidAt, notes } = parsed.data

    const totalAmount = Number(fee.totalAmount)
    const newPaidAmount = Number(fee.paidAmount) + amount
    if (newPaidAmount > totalAmount) {
      const remaining = totalAmount - Number(fee.paidAmount)
      return NextResponse.json(
        { error: `O valor do pagamento excede o saldo pendente (R$ ${remaining.toFixed(2)}).` },
        { status: 400 }
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.feePayment.create({
        data: {
          feeId: fee.id,
          amount,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          notes: notes ?? null,
        },
      })
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

    return NextResponse.json({ fee: updated }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
