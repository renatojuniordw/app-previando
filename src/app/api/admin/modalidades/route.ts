import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getModalidades } from '@/lib/modalidades'
import { handleApiError } from '@/lib/api-error'

function requireAdmin(session: Session | null, req: NextRequest) {
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

const createSchema = z.object({
  codigo: z.string().min(1),
  label: z.string().min(1),
  descricao: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().nonnegative().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const guard = requireAdmin(session, req)
    if (guard) return guard

    const modalidades = await getModalidades({ includeInactive: true })
    return NextResponse.json({ modalidades })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const guard = requireAdmin(session, req)
    if (guard) return guard

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    const modalidade = await prisma.modalidadeLabel.upsert({
      where: { codigo: parsed.data.codigo },
      update: {
        label: parsed.data.label,
        descricao: parsed.data.descricao ?? null,
        ativo: parsed.data.ativo ?? true,
        ordem: parsed.data.ordem ?? 0,
      },
      create: {
        codigo: parsed.data.codigo,
        label: parsed.data.label,
        descricao: parsed.data.descricao ?? null,
        ativo: parsed.data.ativo ?? true,
        ordem: parsed.data.ordem ?? 0,
      },
    })

    return NextResponse.json({ modalidade }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
