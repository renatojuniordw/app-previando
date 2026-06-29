import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

const updateSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  totalAmount: z.number().positive().optional(),
  paidAmount: z.number().min(0).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
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
    await verifyFeeOwnership(params.feeId, params.id)

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const data: Record<string, unknown> = {}
    const d = parsed.data
    if (d.description !== undefined) data.description = d.description
    if (d.totalAmount !== undefined) data.totalAmount = d.totalAmount
    if (d.paidAmount !== undefined) data.paidAmount = d.paidAmount
    if (d.dueDate !== undefined) data.dueDate = d.dueDate ? new Date(d.dueDate) : null
    if (d.status !== undefined) data.status = d.status
    if (d.notes !== undefined) data.notes = d.notes ?? null

    const fee = await prisma.fee.update({
      where: { id: params.feeId },
      data,
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
