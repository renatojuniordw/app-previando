import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

function requireAdmin(session: Session | null, req: NextRequest) {
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

const updateSchema = z.object({
  valor: z.number().positive(),
  teto: z.number().positive(),
  legislacao: z.string().min(1),
  reajuste: z.number().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const guard = requireAdmin(session, req)
    if (guard) return guard

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    const registro = await prisma.salarioMinimo.update({
      where: { id: params.id },
      data: { ...parsed.data, reajuste: parsed.data.reajuste ?? null },
    })

    return NextResponse.json({ registro })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const guard = requireAdmin(session, req)
    if (guard) return guard

    await prisma.salarioMinimo.delete({ where: { id: params.id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
