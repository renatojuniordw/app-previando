import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { computeFeeStatus, FEE_TYPES } from '@/lib/fee-status'

const createSchema = z.object({
  description: z.string().min(1).max(200),
  type: z.enum(FEE_TYPES).optional(),
  totalAmount: z.number().positive(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const fees = await prisma.fee.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
      include: { payments: { orderBy: { paidAt: 'desc' } } },
    })

    // Honorários cancelados não entram no total combinado nem no pendente do caso.
    const active = fees.filter((f) => f.status !== 'CANCELLED')
    const total = active.reduce((sum, f) => sum + Number(f.totalAmount), 0)
    const paid = active.reduce((sum, f) => sum + Number(f.paidAmount), 0)

    return NextResponse.json({ fees, summary: { total, paid, pending: total - paid } })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const { description, type, totalAmount, dueDate, notes } = parsed.data
    const parsedDueDate = dueDate ? new Date(dueDate) : null

    const fee = await prisma.fee.create({
      data: {
        caseId: params.id,
        description,
        type: type ?? 'FIXED',
        totalAmount,
        paidAmount: 0,
        dueDate: parsedDueDate,
        status: computeFeeStatus({ totalAmount, paidAmount: 0, dueDate: parsedDueDate }),
        notes: notes ?? null,
      },
      include: { payments: true },
    })

    return NextResponse.json({ fee }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
