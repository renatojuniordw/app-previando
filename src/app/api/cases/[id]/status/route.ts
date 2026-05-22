import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

const schema = z.object({
  status: z.enum(['PROSPECCAO', 'ANALISE', 'PRONTO_PARA_REQUERER', 'EM_PROCESSAMENTO', 'FINALIZADO']),
  processNumber: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    const data: Record<string, unknown> = { status: parsed.data.status }

    // Ao protocolar (EM_PROCESSAMENTO), pode salvar número CNJ
    if (parsed.data.status === 'EM_PROCESSAMENTO' && parsed.data.processNumber) {
      const cnj = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/
      if (cnj.test(parsed.data.processNumber)) {
        data.processNumber = parsed.data.processNumber
      }
    }

    const caso = await prisma.case.update({
      where: { id: params.id },
      data,
      select: { id: true, status: true, processNumber: true },
    })

    return NextResponse.json({ case: caso })
  } catch (err) {
    return handleApiError(err)
  }
}
