import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authWithFreshPlan } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api-error'
import { deleteAccount } from '@/lib/account-deletion'

const schema = z.object({ confirm: z.literal('EXCLUIR') })

export async function DELETE(req: NextRequest) {
  try {
    const session = await authWithFreshPlan()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Confirmação inválida. Digite EXCLUIR para confirmar.' }, { status: 400 })
    }

    await deleteAccount(session.user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
