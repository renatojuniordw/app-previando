import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'
import { trackjud } from '@/services/trackjud'

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
        trackjudMonitorId: true,
        trackjudRegisteredAt: true,
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
      select: {
        processNumber: true,
        processLastCheck: true,
        trackjudMonitorId: true,
      },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })
    if (!caso.processNumber) {
      return NextResponse.json({ error: 'Nenhum número de processo cadastrado neste caso.' }, { status: 400 })
    }
    if (!caso.trackjudMonitorId) {
      return NextResponse.json({
        error: 'Processo ainda não registrado para monitoramento no TrackJud.',
      }, { status: 400 })
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

    const result = await trackjud.getProcess(caso.trackjudMonitorId)

    const now = new Date()
    const updateData: {
      processLastCheck: Date
      processLastMovDate?: Date | null
      processLastMovCount?: number
      processLastSummary?: string | null
    } = { processLastCheck: now }

    if (result) {
      updateData.processLastMovDate = result.ultimaMovimentacao?.data
        ? new Date(result.ultimaMovimentacao.data)
        : null
      updateData.processLastMovCount = result.totalMovimentacoes
      updateData.processLastSummary = result.ultimaMovimentacao?.descricao ?? null
    }

    const updated = await prisma.case.update({
      where: { id: params.id },
      data: updateData,
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
      metadata: { processNumber: caso.processNumber, found: !!result },
    })

    return NextResponse.json({
      process: updated,
      trackjud: result,
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
