import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

const updateSchema = z.object({
  idadeMinima:          z.number().positive().nullable().optional(),
  tempoContribuicaoAnos:z.number().int().positive().nullable().optional(),
  pontosMinimos:        z.number().int().positive().nullable().optional(),
  carenciaMeses:        z.number().int().positive().nullable().optional(),
  descricao:            z.string().min(1).optional(),
  legislacao:           z.string().min(1).optional(),
  observacoes:          z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const {
      idadeMinima,
      tempoContribuicaoAnos,
      pontosMinimos,
      carenciaMeses,
      descricao,
      legislacao,
      observacoes,
    } = parsed.data

    const dbRegistro = await prisma.retirementRule.update({
      where: { id: params.id },
      data: {
        minimumAge: idadeMinima,
        contributionYears: tempoContribuicaoAnos,
        minimumPoints: pontosMinimos,
        gracePeriodMonths: carenciaMeses,
        description: descricao,
        legislation: legislacao,
        notes: observacoes !== undefined ? observacoes : undefined,
      },
    })

    const registro = {
      id: dbRegistro.id,
      modalidade: dbRegistro.modality,
      genero: dbRegistro.gender,
      vigencia: dbRegistro.effectiveDate.toISOString(),
      idadeMinima: dbRegistro.minimumAge ? Number(dbRegistro.minimumAge) : null,
      tempoContribuicaoAnos: dbRegistro.contributionYears,
      pontosMinimos: dbRegistro.minimumPoints,
      carenciaMeses: dbRegistro.gracePeriodMonths,
      descricao: dbRegistro.description,
      legislacao: dbRegistro.legislation,
      observacoes: dbRegistro.notes,
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

    await prisma.retirementRule.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
