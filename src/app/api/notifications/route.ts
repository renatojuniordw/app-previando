import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        caseId: true,
        message: true,
        read: true,
        createdAt: true,
      },
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    return NextResponse.json({ notifications, unreadCount }, {
      headers: { 'Cache-Control': 'private, max-age=0, stale-while-revalidate=15' },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
