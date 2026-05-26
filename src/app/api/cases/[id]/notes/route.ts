import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { sanitizeInput } from '@/lib/sanitize'
import { handleApiError } from '@/lib/api-error'
import { mapNoteTypeToDb, mapNoteToApi, ApiNoteType } from '@/lib/mappers'

const createSchema = z.object({
  type: z.enum(['CONTATO', 'DOCUMENTO', 'JURIDICO', 'INTERNO', 'CALCULO', 'PENDENCIA']),
  content: z.string().min(1).max(5000),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const { searchParams } = req.nextUrl
    const type = searchParams.get('type')

    const notes = await prisma.caseNote.findMany({
      where: {
        caseId: params.id,
        ...(type ? { type: mapNoteTypeToDb(type as ApiNoteType) } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ notes: notes.map(mapNoteToApi) })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    // Calcular próximo número de versão sequencial
    const lastNote = await prisma.caseNote.findFirst({
      where: { caseId: params.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const version = (lastNote?.version ?? 0) + 1

    // Prontuário é IMUTÁVEL — sem opção de editar/deletar
    const note = await prisma.caseNote.create({
      data: {
        caseId: params.id,
        userId: session.user.id,
        type: mapNoteTypeToDb(parsed.data.type as ApiNoteType),
        content: sanitizeInput(parsed.data.content),
        version,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ note: mapNoteToApi(note) }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
