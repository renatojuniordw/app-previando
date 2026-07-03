import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'

const COOLDOWN_MINUTES = 10

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      select: {
        processNumber: true,
        processLastCheck: true,
        processLastMovDate: true,
        processLastMovCount: true,
        processLastSummary: true,
      },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })

    return NextResponse.json({ process: caso })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      select: { processNumber: true, processLastCheck: true },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })
    if (!caso.processNumber) {
      return NextResponse.json({ error: 'Nenhum número de processo cadastrado neste caso.' }, { status: 400 })
    }

    if (caso.processLastCheck) {
      const diffMs = Date.now() - caso.processLastCheck.getTime()
      if (diffMs < COOLDOWN_MINUTES * 60 * 1000) {
        const remainingMin = Math.ceil((COOLDOWN_MINUTES * 60 * 1000 - diffMs) / 60000)
        return NextResponse.json(
          { error: `Aguarde ${remainingMin} min antes de consultar novamente.` },
          { status: 429 }
        )
      }
    }

    const now = new Date()
    const updated = await prisma.case.update({
      where: { id: params.id },
      data: { processLastCheck: now },
      select: {
        processNumber: true,
        processLastCheck: true,
        processLastMovDate: true,
        processLastMovCount: true,
        processLastSummary: true,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'case.process.checked',
      resource: `case:${params.id}`,
      req,
      metadata: { processNumber: caso.processNumber },
    })

    return NextResponse.json({
      process: updated,
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
