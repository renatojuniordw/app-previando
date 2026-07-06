import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { FEE_STATUSES } from '@/lib/fee-status'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const search = searchParams.get('search')?.trim()
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Prisma.FeeWhereInput = {
      case: { userId: session.user.id },
    }

    if (status && (FEE_STATUSES as readonly string[]).includes(status)) {
      where.status = status as (typeof FEE_STATUSES)[number]
    }

    if (search) {
      where.case = {
        userId: session.user.id,
        client: { name: { contains: search, mode: 'insensitive' } },
      }
    }

    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    const fees = await prisma.fee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        case: {
          select: {
            id: true,
            benefitType: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
    })

    const active = fees.filter((f) => f.status !== 'CANCELLED')
    const total = active.reduce((sum, f) => sum + Number(f.totalAmount), 0)
    const paid = active.reduce((sum, f) => sum + Number(f.paidAmount), 0)
    const pending = total - paid
    const collectionRate = total > 0 ? Number(((paid / total) * 100).toFixed(1)) : 0

    return NextResponse.json({
      fees,
      summary: { total, paid, pending, collectionRate },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
