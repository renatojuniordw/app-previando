import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { isValidCNJ, consultarProcesso } from '@/services/datajud'
import { summarizeProcesso } from '@/services/datajud/summarize'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { differenceInHours } from 'date-fns'

const CACHE_HOURS = 4

/**
 * GET /api/cases/:id/process
 * Consulta andamento do processo no Datajud com cache inteligente (4h)
 * Rate limit: 10 consultas/hora por usuário
 * Plano guard: datajudEnabled (FREE bloqueado)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await guardFeature(session.user.plan, 'USE_DATAJUD')

    // Rate limit: 10 consultas/hora por usuário
    const limit = await rateLimit(`datajud:${session.user.id}`, 10, 3600)
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Limite de consultas Datajud atingido. Tente novamente em 1 hora.' },
        { status: 429 }
      )
    }

    await verifyCaseOwnership(params.id, session.user.id)

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      include: { client: { select: { name: true } } },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })

    if (!caso.processNumber) {
      return NextResponse.json(
        { error: 'Número de processo não cadastrado neste caso.' },
        { status: 400 }
      )
    }

    const agora = new Date()

    // ── Cache válido: lastCheck < 4h E movCount não aumentou ─
    const cacheValido =
      caso.processLastCheck !== null &&
      differenceInHours(agora, caso.processLastCheck) < CACHE_HOURS

    if (cacheValido && caso.processLastSummary) {
      return NextResponse.json({
        summary: caso.processLastSummary,
        processNumber: caso.processNumber,
        lastMovDate: caso.processLastMovDate,
        lastMovCount: caso.processLastMovCount,
        lastCheck: caso.processLastCheck,
        fromCache: true,
      })
    }

    // ── Consultar Datajud ────────────────────────────────────
    let processoData
    try {
      processoData = await consultarProcesso(caso.processNumber)
    } catch (err) {
      // Fallback: retorna cache antigo com aviso se Datajud falhar
      if (caso.processLastSummary) {
        return NextResponse.json({
          summary: caso.processLastSummary,
          processNumber: caso.processNumber,
          lastMovDate: caso.processLastMovDate,
          lastMovCount: caso.processLastMovCount,
          lastCheck: caso.processLastCheck,
          fromCache: true,
          cacheWarning:
            'Não foi possível conectar ao Datajud. Exibindo a última informação disponível.',
        })
      }
      return NextResponse.json(
        { error: `Erro ao consultar Datajud: ${String(err)}` },
        { status: 503 }
      )
    }

    // ── Verificar se houve atualização ──────────────────────
    const movCountChanged = caso.processLastMovCount !== processoData.totalMovimentos
    const movDateChanged =
      caso.processLastMovDate?.toISOString() !==
      new Date(processoData.dataUltimaAtualizacao).toISOString()

    const processoAtualizado = movCountChanged || movDateChanged

    if (!processoAtualizado && caso.processLastSummary) {
      // Sem novidades — atualiza apenas o lastCheck, sem chamar IA
      await prisma.case.update({
        where: { id: params.id },
        data: { processLastCheck: agora },
      })

      return NextResponse.json({
        summary: caso.processLastSummary,
        processNumber: caso.processNumber,
        lastMovDate: caso.processLastMovDate,
        lastMovCount: caso.processLastMovCount,
        lastCheck: agora,
        fromCache: true,
        noChanges: true,
      })
    }

    // ── Gerar resumo com IA ──────────────────────────────────
    const { summary } = await summarizeProcesso(processoData, caso.client?.name ?? 'Cliente')

    await prisma.case.update({
      where: { id: params.id },
      data: {
        processLastCheck: agora,
        processLastMovDate: new Date(processoData.dataUltimaAtualizacao),
        processLastMovCount: processoData.totalMovimentos,
        processLastSummary: summary,
      },
    })

    return NextResponse.json({
      summary,
      processNumber: caso.processNumber,
      lastMovDate: new Date(processoData.dataUltimaAtualizacao),
      lastMovCount: processoData.totalMovimentos,
      lastCheck: agora,
      fromCache: false,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * PATCH /api/cases/:id/process
 * Salva número CNJ. Limpa cache anterior ao trocar número.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const body = await req.json()
    const { processNumber } = body

    if (!processNumber || !isValidCNJ(processNumber)) {
      return NextResponse.json(
        {
          error:
            'Número de processo inválido. Use o formato CNJ: 0001234-55.2024.4.03.6183',
        },
        { status: 422 }
      )
    }

    // Ao trocar número, limpa cache anterior
    await prisma.case.update({
      where: { id: params.id },
      data: {
        processNumber,
        processLastCheck: null,
        processLastMovDate: null,
        processLastMovCount: null,
        processLastSummary: null,
      },
    })

    return NextResponse.json({ success: true, processNumber })
  } catch (err) {
    return handleApiError(err)
  }
}
