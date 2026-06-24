import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

function requireAdmin(session: Session | null, req: NextRequest) {
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

const createSchema = z.object({
  vigencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  valor: z.number().positive(),
  teto: z.number().positive(),
  legislacao: z.string().min(1),
  reajuste: z.number().nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const guard = requireAdmin(session, req)
    if (guard) return guard

    const dbRegistros = await prisma.minimumWage.findMany({
      orderBy: { effectiveDate: 'desc' },
    })

    const registros = dbRegistros.map((r) => ({
      id: r.id,
      vigencia: r.effectiveDate.toISOString(),
      valor: Number(r.value),
      teto: Number(r.ceiling),
      legislacao: r.legislation,
      reajuste: r.readjustment,
    }))

    return NextResponse.json({ registros })
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

    const { vigencia, valor, teto, legislacao, reajuste } = parsed.data
    const vigenciaDate = new Date(vigencia + 'T00:00:00.000Z')

    const dbRegistro = await prisma.minimumWage.upsert({
      where: { effectiveDate: vigenciaDate },
      update: { value: valor, ceiling: teto, legislation: legislacao, readjustment: reajuste ?? null },
      create: { effectiveDate: vigenciaDate, value: valor, ceiling: teto, legislation: legislacao, readjustment: reajuste ?? null },
    })

    const registro = {
      id: dbRegistro.id,
      vigencia: dbRegistro.effectiveDate.toISOString(),
      valor: Number(dbRegistro.value),
      teto: Number(dbRegistro.ceiling),
      legislacao: dbRegistro.legislation,
      reajuste: dbRegistro.readjustment,
    }

    return NextResponse.json({ registro }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
