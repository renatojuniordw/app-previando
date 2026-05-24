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

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const guard = requireAdmin(session, req)
    if (guard) return guard

    const registros = await prisma.regraAposentadoria.findMany({
      orderBy: [{ modalidade: 'asc' }, { genero: 'asc' }, { vigencia: 'desc' }],
    })

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

    const { vigencia, ...rest } = parsed.data
    const vigenciaDate = new Date(vigencia + 'T00:00:00.000Z')

    const registro = await prisma.regraAposentadoria.upsert({
      where: { modalidade_genero_vigencia: { modalidade: rest.modalidade, genero: rest.genero, vigencia: vigenciaDate } },
      update: { ...rest, vigencia: vigenciaDate },
      create: { ...rest, vigencia: vigenciaDate },
    })

    return NextResponse.json({ registro }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
