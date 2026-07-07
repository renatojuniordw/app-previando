import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authWithFreshPlan } from '@/lib/auth-server'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { deleteAccount } from '@/lib/account-deletion'

const schema = z.object({ confirm: z.literal('EXCLUIR') })

export async function DELETE(req: NextRequest) {
  try {
    const session = await authWithFreshPlan()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { success: limitOk } = await rateLimit(`delete-account:${session.user.id}`, 2, 3600)
    if (!limitOk) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })

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
