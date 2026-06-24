import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@/auth"
import type { Session } from "next-auth"
import { prisma } from '@/lib/prisma'
import type { PaymentStatus } from '@prisma/client'

function requireAdmin(session: Session | null, req: NextRequest) {
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const guard = requireAdmin(session, req)
  if (guard) return guard

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
}
