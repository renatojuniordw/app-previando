import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { handleApiError } from '@/lib/api-error'

function requireAdmin(session: Session | null, req: NextRequest) {
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const guard = requireAdmin(session, req)
    if (guard) return guard

    const body = await req.json()
    const { action } = body

    if (!['suspend', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const newStatus = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE'

    await prisma.user.update({ where: { id: params.id }, data: { planStatus: newStatus } })

    await logAudit({
      userId: session!.user!.id!,
      action: action === 'suspend' ? 'admin.user.suspend' : 'admin.user.activate',
      resource: `user:${params.id}`,
      req,
      metadata: { targetEmail: user.email },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
