import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

const createSchema = z.object({
  modalidade:           z.string().min(1),
  genero:               z.enum(['M', 'F', 'AMBOS']),
  vigencia:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  idadeMinima:          z.number().positive().nullable().optional(),
  tempoContribuicaoAnos:z.number().int().positive().nullable().optional(),
  pontosMinimos:        z.number().int().positive().nullable().optional(),
  carenciaMeses:        z.number().int().positive().nullable().optional(),
  descricao:            z.string().min(1),
  legislacao:           z.string().min(1),
  observacoes:          z.string().nullable().optional(),
})

export async function GET(_req: NextRequest) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const dbRegistros = await prisma.retirementRule.findMany({
      orderBy: [{ modality: 'asc' }, { gender: 'asc' }, { effectiveDate: 'desc' }],
    })

    const registros = dbRegistros.map((r) => ({
      id: r.id,
      modalidade: r.modality,
      genero: r.gender,
      vigencia: r.effectiveDate.toISOString(),
      idadeMinima: r.minimumAge ? Number(r.minimumAge) : null,
      tempoContribuicaoAnos: r.contributionYears,
      pontosMinimos: r.minimumPoints,
      carenciaMeses: r.gracePeriodMonths,
      descricao: r.description,
      legislacao: r.legislation,
      observacoes: r.notes,
    }))

    return NextResponse.json({ registros })
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

    const {
      modalidade,
      genero,
      vigencia,
      idadeMinima,
      tempoContribuicaoAnos,
      pontosMinimos,
      carenciaMeses,
      descricao,
      legislacao,
      observacoes,
    } = parsed.data
    const vigenciaDate = new Date(vigencia + 'T00:00:00.000Z')

    const dbRegistro = await prisma.retirementRule.upsert({
      where: {
        modality_gender_effectiveDate: {
          modality: modalidade,
          gender: genero,
          effectiveDate: vigenciaDate,
        },
      },
      update: {
        minimumAge: idadeMinima,
        contributionYears: tempoContribuicaoAnos,
        minimumPoints: pontosMinimos,
        gracePeriodMonths: carenciaMeses,
        description: descricao,
        legislation: legislacao,
        notes: observacoes ?? null,
      },
      create: {
        modality: modalidade,
        gender: genero,
        effectiveDate: vigenciaDate,
        minimumAge: idadeMinima,
        contributionYears: tempoContribuicaoAnos,
        minimumPoints: pontosMinimos,
        gracePeriodMonths: carenciaMeses,
        description: descricao,
        legislation: legislacao,
        notes: observacoes ?? null,
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

    return NextResponse.json({ registro }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
