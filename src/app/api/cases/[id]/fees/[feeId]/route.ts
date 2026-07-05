import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { computeFeeStatus, FEE_TYPES } from '@/lib/fee-status'

const updateSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  type: z.enum(FEE_TYPES).optional(),
  totalAmount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  cancelled: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
})

async function verifyFeeOwnership(feeId: string, caseId: string) {
  const fee = await prisma.fee.findFirst({ where: { id: feeId, caseId } })
  if (!fee) throw new Error('Honorário não encontrado.')
  return fee
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; feeId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)
    const existing = await verifyFeeOwnership(params.feeId, params.id)

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    const d = parsed.data

    const totalAmount = d.totalAmount ?? Number(existing.totalAmount)
    const paidAmount = Number(existing.paidAmount)
    if (paidAmount > totalAmount) {
      return NextResponse.json(
        { error: 'O valor total não pode ser menor que o valor já recebido.' },
        { status: 400 }
      )
    }

    const dueDate = d.dueDate !== undefined
      ? (d.dueDate ? new Date(d.dueDate) : null)
      : existing.dueDate
    const cancelled = d.cancelled ?? existing.status === 'CANCELLED'

    const data: Record<string, unknown> = {
      totalAmount,
      dueDate,
      status: computeFeeStatus({ totalAmount, paidAmount, dueDate, cancelled }),
    }
    if (d.description !== undefined) data.description = d.description
    if (d.type !== undefined) data.type = d.type
    if (d.notes !== undefined) data.notes = d.notes ?? null

    const fee = await prisma.fee.update({
      where: { id: params.feeId },
      data,
      include: { payments: { orderBy: { paidAt: 'desc' } } },
    })

    return NextResponse.json({ fee })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; feeId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)
    await verifyFeeOwnership(params.feeId, params.id)

    await prisma.fee.delete({ where: { id: params.feeId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
