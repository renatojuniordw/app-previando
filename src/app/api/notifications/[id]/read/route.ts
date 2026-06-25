import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Notificação não encontrada.' }, { status: 404 })
    }

    await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
