import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const today = new Date()
    const in30days = new Date(today)
    in30days.setDate(in30days.getDate() + 30)

    const cases = await prisma.case.findMany({
      where: {
        userId: session.user.id,
        status: { not: 'FINALIZADO' },
        deadlineDate: { lte: in30days },
      },
      orderBy: [{ priority: 'asc' }, { deadlineDate: 'asc' }],
      select: {
        id: true,
        status: true,
        priority: true,
        benefitType: true,
        deadlineDate: true,
        deadlineDays: true,
        client: { select: { id: true, name: true } },
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withDaysLeft = (cases as any[]).map((c) => ({
      ...c,
      daysLeft: c.deadlineDate
        ? Math.ceil((c.deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }))

    return NextResponse.json({ deadlines: withDaysLeft })
  } catch (err) {
    return handleApiError(err)
  }
}
