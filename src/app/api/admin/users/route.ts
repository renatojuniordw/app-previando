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
    const search = searchParams.get('search') ?? ''
    const plan = searchParams.get('plan') ?? undefined
    const status = searchParams.get('status') ?? undefined
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = 20
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }]
    if (plan) where.plan = plan as Prisma.EnumPlanFilter['equals']
    if (status === 'suspended') where.planStatus = 'SUSPENDED'
    if (status === 'active') where.planStatus = { not: 'SUSPENDED' }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, plan: true, planStatus: true, isAdmin: true, createdAt: true, _count: { select: { clients: true, cases: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    return handleApiError(err)
  }
}
