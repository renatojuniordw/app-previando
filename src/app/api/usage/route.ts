import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const [user, usage, limits] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true, planStatus: true, planExpiresAt: true },
      }),
      prisma.usageRecord.findUnique({
        where: { userId: session.user.id },
        select: {
          totalClients: true,
          calculationsThisMonth: true,
          opinionsThisMonth: true,
          usageMonthRef: true,
        },
      }),
      prisma.planLimit.findUnique({
        where: { plan: session.user.plan as never },
      }),
    ])

    return NextResponse.json({
      plan: user?.plan ?? 'FREE',
      planStatus: user?.planStatus ?? 'ACTIVE',
      planExpiresAt: user?.planExpiresAt ?? null,
      usage: {
        totalClients: usage?.totalClients ?? 0,
        calculationsThisMonth: usage?.calculationsThisMonth ?? 0,
        opinionsThisMonth: usage?.opinionsThisMonth ?? 0,
        usageMonthRef: usage?.usageMonthRef ?? null,
      },
      limits: limits ?? null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
