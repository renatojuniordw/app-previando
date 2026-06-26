import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { sanitizeInput } from '@/lib/sanitize'
import { handleApiError } from '@/lib/api-error'

// Aceita tanto `editedContent` (nome do frontend) quanto `customizedContent` (nome legado do banco)
const updateSchema = z.object({
  editedContent: z.string().min(1).max(20000).optional(),
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

    const body = await req.json()
    console.log('[opinions PUT] body recebido:', {
      oId: params.oId,
      hasEditedContent: 'editedContent' in body,
      hasCustomizedContent: 'customizedContent' in body,
      status: body.status,
    })

    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      console.error('[opinions PUT] Validação falhou:', parsed.error.flatten())
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    // editedContent é o nome enviado pelo frontend; mapeia para customizedContent no banco
    const contentValue = parsed.data.editedContent ?? parsed.data.customizedContent
    if (contentValue) {
      data.customizedContent = sanitizeInput(contentValue)
    }
    if (parsed.data.status) {
      data.status = parsed.data.status
    }

    console.log('[opinions PUT] Atualizando campos:', Object.keys(data))

    const updated = await prisma.opinion.update({
      where: { id: params.oId },
      data,
    })

    return NextResponse.json({ opinion: updated })
  } catch (err) {
    return handleApiError(err)
  }
}
