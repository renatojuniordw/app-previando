import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import type { PaymentStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const statusParam = searchParams.get('status')
    const limit = 20
    const skip = (page - 1) * limit

    const where = statusParam ? { status: statusParam as PaymentStatus } : {}

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({ payments, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    return handleApiError(err)
  }
}
