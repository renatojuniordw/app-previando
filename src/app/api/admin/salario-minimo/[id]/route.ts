import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

const updateSchema = z.object({
  valor: z.number().positive(),
  teto: z.number().positive(),
  legislacao: z.string().min(1),
  reajuste: z.number().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const { valor, teto, legislacao, reajuste } = parsed.data

    const dbRegistro = await prisma.minimumWage.update({
      where: { id: params.id },
      data: {
        value: valor,
        ceiling: teto,
        legislation: legislacao,
        readjustment: reajuste ?? null,
      },
    })

    const registro = {
      id: dbRegistro.id,
      vigencia: dbRegistro.effectiveDate.toISOString(),
      valor: Number(dbRegistro.value),
      teto: Number(dbRegistro.ceiling),
      legislacao: dbRegistro.legislation,
      reajuste: dbRegistro.readjustment,
    }

    return NextResponse.json({ registro })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    await prisma.minimumWage.delete({ where: { id: params.id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
