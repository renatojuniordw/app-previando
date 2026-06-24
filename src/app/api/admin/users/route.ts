import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@/auth"
import type { Session } from "next-auth"
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

function requireAdmin(session: Session | null, req: NextRequest) {
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const guard = requireAdmin(session, req)
  if (guard) return guard

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const plan = searchParams.get('plan') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Prisma.UserWhereInput = {} as any
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }]
  if (plan) where.plan = plan as never
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
}
