import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const documents = await prisma.document.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, fileName: true, contentType: true, shared: true, createdAt: true },
    })

    return NextResponse.json({ documents })
  } catch (err) {
    return handleApiError(err)
  }
}
