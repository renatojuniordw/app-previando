import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? undefined
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = 20
    const skip = (page - 1) * limit

    const where: Prisma.SupportTicketWhereInput = {}
    if (status) where.status = status as Prisma.EnumTicketStatusFilter['equals']

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, plan: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ])

    return NextResponse.json({ tickets, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    return handleApiError(err)
  }
}
