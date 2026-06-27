import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getModalidades } from '@/lib/modalidades'
import { handleApiError } from '@/lib/api-error'

const createSchema = z.object({
  codigo: z.string().min(1),
  label: z.string().min(1),
  descricao: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().nonnegative().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const modalidades = await getModalidades({ includeInactive: true })
    return NextResponse.json({ modalidades })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const modalidade = await prisma.modalityLabel.upsert({
      where: { code: parsed.data.codigo },
      update: {
        label: parsed.data.label,
        description: parsed.data.descricao ?? null,
        active: parsed.data.ativo ?? true,
        order: parsed.data.ordem ?? 0,
      },
      create: {
        code: parsed.data.codigo,
        label: parsed.data.label,
        description: parsed.data.descricao ?? null,
        active: parsed.data.ativo ?? true,
        order: parsed.data.ordem ?? 0,
      },
    })

    return NextResponse.json({ modalidade }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
