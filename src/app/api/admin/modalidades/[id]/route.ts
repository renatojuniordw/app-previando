import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

const updateSchema = z.object({
  codigo: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  descricao: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().nonnegative().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const { codigo, label, descricao, ativo, ordem } = parsed.data

    const modalidade = await prisma.modalityLabel.update({
      where: { id: params.id },
      data: {
        ...(codigo !== undefined && { code: codigo }),
        ...(label !== undefined && { label }),
        ...(descricao !== undefined && { description: descricao }),
        ...(ativo !== undefined && { active: ativo }),
        ...(ordem !== undefined && { order: ordem }),
      },
    })

    return NextResponse.json({ modalidade })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    await prisma.modalityLabel.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
