import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { handleApiError } from '@/lib/api-error'
import { deleteAccount } from '@/lib/account-deletion'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, deletedAt: true } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    if (user.deletedAt) return NextResponse.json({ error: 'Usuário já foi excluído/anonimizado.' }, { status: 409 })

    await deleteAccount(params.id)

    await logAudit({
      userId: adminResult.userId,
      action: 'admin.user.anonymized',
      resource: `user:${params.id}`,
      req,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
