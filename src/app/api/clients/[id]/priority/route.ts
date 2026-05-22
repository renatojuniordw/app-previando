import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyClientOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

const schema = z.object({
  priority: z.enum(['CRITICAL', 'ATTENTION', 'NORMAL']),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyClientOwnership(params.id, session.user.id)

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Prioridade inválida.' }, { status: 400 })
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: { priority: parsed.data.priority },
    })

    return NextResponse.json({ priority: client.priority })
  } catch (err) {
    return handleApiError(err)
  }
}
