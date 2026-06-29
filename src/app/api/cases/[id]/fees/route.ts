import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

const createSchema = z.object({
  description: z.string().min(1).max(200),
  totalAmount: z.number().positive(),
  paidAmount: z.number().min(0).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
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
    })

    const total = fees.reduce((sum, f) => sum + Number(f.totalAmount), 0)
    const paid = fees.reduce((sum, f) => sum + Number(f.paidAmount), 0)

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

    const { description, totalAmount, paidAmount = 0, dueDate, status, notes } = parsed.data

    const fee = await prisma.fee.create({
      data: {
        caseId: params.id,
        description,
        totalAmount,
        paidAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status ?? 'PENDING',
        notes: notes ?? null,
      },
    })

    return NextResponse.json({ fee }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
