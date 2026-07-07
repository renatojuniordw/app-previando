import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { mapCaseStatusToDb, mapCaseStatusToApi, ApiCaseStatus } from '@/lib/mappers'

const schema = z.object({
  status: z.enum(['PROSPECCAO', 'ANALISE', 'PRONTO_PARA_REQUERER', 'EM_PROCESSAMENTO', 'FINALIZADO']),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnershipAndActive(params.id, session.user.id)

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    const newStatus = mapCaseStatusToDb(parsed.data.status as ApiCaseStatus)

    const caso = await prisma.case.update({
      where: { id: params.id },
      data: { status: newStatus },
      select: { id: true, status: true },
    })

    return NextResponse.json({
      case: {
        id: caso.id,
        status: mapCaseStatusToApi(caso.status),
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
