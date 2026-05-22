import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { sanitizeInput } from '@/lib/sanitize'
import { handleApiError } from '@/lib/api-error'

const updateSchema = z.object({
  customizedContent: z.string().min(1).max(20000).optional(),
  status: z.enum(['GENERATED', 'REVIEWED', 'FINALIZED']).optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; oId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const opinion = await prisma.opinion.findFirst({
      where: { id: params.oId, caseId: params.id },
    })
    if (!opinion) return NextResponse.json({ error: 'Parecer não encontrado.' }, { status: 404 })

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.customizedContent) {
      data.customizedContent = sanitizeInput(parsed.data.customizedContent)
    }
    if (parsed.data.status) {
      data.status = parsed.data.status
    }

    const updated = await prisma.opinion.update({
      where: { id: params.oId },
      data,
    })

    return NextResponse.json({ opinion: updated })
  } catch (err) {
    return handleApiError(err)
  }
}
